/**
 * FWY mock exams — results backend (Google Apps Script, bound to the "FWY Mock Results" sheet).
 *
 * Tabs:   Students · Keys · Attempts · Results  (created by setup())
 * The website sends JSON to this web app; the answers are checked here, so they never appear on the site.
 *
 * Teacher: to mark writing or speaking, type a number in "Teacher mark" (TCF: out of 20, TEF: out of 699)
 * and, if you want, a "Teacher comment". The student sees it in "My results".
 */

var CONFIG = {
  sections: {
    tcf: { co: 35 * 60, ce: 60 * 60, ee: 60 * 60, eo: 12 * 60 },
    tef: { co: 40 * 60, ce: 60 * 60, ee: 60 * 60, eo: 15 * 60 }
  },
  graceSeconds: 120,          // late answers accepted after the timer (slow connections)
  speakingExtraSeconds: 1800, // speaking: extra time for preparation pauses and uploads
  recordingsFolder: "FWY Mock Recordings"
};

var TABS = {
  Students: ["Code", "Name", "Access", "Retakes", "Active", "Notes"],
  Keys: ["exam", "mock", "section", "q", "answer", "points", "explanation", "options", "question", "transcript"],
  Attempts: ["Attempt ID", "Code", "Name", "Exam", "Mock", "Section", "Started", "Deadline", "Status", "Saved", "Last save"],
  Results: ["Date", "Code", "Name", "Exam", "Mock", "Section", "Correct", "Total", "Points", "Score", "CEFR", "NCLC", "Status",
            "Teacher mark", "Teacher comment", "Answers or texts", "Recordings", "Attempt ID"]
};

/* ---------------------------------------------------------------- levels (same as assets/js/levels.js) */
var NCLC = {
  tcf: { co: [331, 369, 398, 458, 503, 523, 549], ce: [342, 375, 406, 453, 499, 524, 549],
         ee: [4, 6, 7, 10, 12, 14, 16], eo: [4, 6, 7, 10, 12, 14, 16] },
  tef: { co: [306, 352, 393, 434, 462, 503, 546], ce: [306, 352, 393, 434, 462, 503, 546],
         ee: [268, 330, 379, 428, 472, 512, 558], eo: [328, 387, 422, 456, 494, 518, 556] }
};
function nclcOf(exam, section, score) {
  var t = NCLC[exam][section], lvl = 0;
  for (var i = 0; i < t.length; i++) if (score >= t[i]) lvl = 4 + i;
  return lvl;
}
function cefrOf(exam, section, score) {
  if (exam === "tcf" && (section === "co" || section === "ce")) {
    if (score < 100) return "A1";
    return ["A1", "A2", "B1", "B2", "C1", "C2"][Math.min(5, Math.floor(score / 100) - 1)];
  }
  if (exam === "tcf") {
    if (score >= 16) return "C2"; if (score >= 14) return "C1"; if (score >= 10) return "B2";
    if (score >= 6) return "B1"; if (score >= 4) return "A2"; return "A1";
  }
  var n = nclcOf(exam, section, score);
  if (n >= 9) return "C1"; if (n >= 7) return "B2"; if (n >= 5) return "B1"; if (n === 4) return "A2";
  return "A1";
}
function scaleOf(exam, section) { return exam === "tcf" && (section === "ee" || section === "eo") ? 20 : 699; }

/* ---------------------------------------------------------------- web app entry points */
function doGet() {
  return ContentService.createTextOutput("FWY mock exams: the results service is running.");
}

function doPost(e) {
  var out;
  try {
    var p = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var actions = { ping: ping, login: login, start: start, save: save, upload: upload, submit: submit, result: result, results: results };
    var fn = actions[p.action];
    out = fn ? fn(p) : { ok: false, error: "bad_action" };
  } catch (err) {
    out = { ok: false, error: "server", message: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function ping() { return { ok: true, time: Date.now() }; }

/* ---------------------------------------------------------------- sheet helpers */
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet(name) {
  var sh = ss().getSheetByName(name);
  if (!sh) throw new Error("Missing tab: " + name + ". Run setup() once.");
  return sh;
}

function table(name) {
  var values = sheet(name).getDataRange().getValues();
  var headers = values.length ? values[0].map(String) : TABS[name];
  var col = {};
  headers.forEach(function (h, i) { col[h] = i; });
  return { headers: headers, col: col, rows: values.slice(1) };
}

function cell(tbl, row, header) { var i = tbl.col[header]; return i == null ? "" : row[i]; }

function setCells(name, rowIndex, tbl, values) {
  // rowIndex: 0-based index in tbl.rows → sheet row rowIndex + 2
  var sh = sheet(name);
  Object.keys(values).forEach(function (h) {
    var c = tbl.col[h];
    if (c != null) sh.getRange(rowIndex + 2, c + 1).setValue(values[h]);
  });
}

function appendObj(name, obj) {
  var tbl = table(name);
  sheet(name).appendRow(tbl.headers.map(function (h) { return obj[h] == null ? "" : obj[h]; }));
}

function norm(v) { return String(v == null ? "" : v).trim(); }
function yes(v) { return /^(y|yes|oui|o|true|1)$/i.test(norm(v)); }
function asTime(v) { return v instanceof Date ? v.getTime() : (v ? new Date(v).getTime() : 0); }
function parseJSON(v, d) { try { return v ? JSON.parse(v) : d; } catch (e) { return d; } }

function withLock(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------------------------------------------------------------- students */
function student(code) {
  code = norm(code).toUpperCase();
  if (!code) return null;
  var tbl = table("Students");
  for (var i = 0; i < tbl.rows.length; i++) {
    var r = tbl.rows[i];
    if (norm(cell(tbl, r, "Code")).toUpperCase() === code) {
      var access = norm(cell(tbl, r, "Access")).toLowerCase();
      var list = [];
      if (!access || access.indexOf("tcf") >= 0 || access === "both" || access === "all") list.push("tcf");
      if (!access || access.indexOf("tef") >= 0 || access === "both" || access === "all") list.push("tef");
      var activeCell = norm(cell(tbl, r, "Active"));
      return { code: code, name: norm(cell(tbl, r, "Name")) || code, access: list,
               retakes: yes(cell(tbl, r, "Retakes")), active: activeCell === "" || yes(activeCell) };
    }
  }
  return null;
}

function requireStudent(p) {
  var s = student(p.code);
  if (!s) throw { code: "unknown_code" };
  if (!s.active) throw { code: "inactive" };
  return s;
}

function guarded(fn) {
  return function (p) {
    try { return fn(p); } catch (e) {
      if (e && e.code) return { ok: false, error: e.code };
      throw e;
    }
  };
}

function validSection(p) {
  var secs = CONFIG.sections[p.exam];
  if (!secs || !secs[p.section] || !(Number(p.mock) > 0)) throw { code: "bad_request" };
}

/* ---------------------------------------------------------------- keys and grading */
function loadKeys(exam, mock, section) {
  var tbl = table("Keys"), keys = {};
  tbl.rows.forEach(function (r) {
    if (norm(cell(tbl, r, "exam")).toLowerCase() !== exam || Number(cell(tbl, r, "mock")) !== Number(mock) ||
        norm(cell(tbl, r, "section")).toLowerCase() !== section) return;
    var n = Number(cell(tbl, r, "q"));
    var opts = norm(cell(tbl, r, "options"));
    keys[n] = {
      answer: norm(cell(tbl, r, "answer")).toUpperCase(),
      points: Number(cell(tbl, r, "points")) || 1,
      explanation: norm(cell(tbl, r, "explanation")),
      options: opts ? opts.split(" | ") : [],
      question: norm(cell(tbl, r, "question")),
      transcript: norm(cell(tbl, r, "transcript"))
    };
  });
  return keys;
}

function grade(exam, mock, section, answers) {
  var keys = loadKeys(exam, mock, section);
  var ns = Object.keys(keys).map(Number).sort(function (a, b) { return a - b; });
  if (!ns.length) throw { code: "no_keys" };
  var correct = 0, points = 0, max = 0, review = [];
  answers = answers || {};
  ns.forEach(function (n) {
    var k = keys[n];
    var given = norm(answers[n] || answers[String(n)]).toUpperCase();
    var ok = given !== "" && given === k.answer;
    max += k.points;
    if (ok) { correct++; points += k.points; }
    review.push({ n: n, given: given, answer: k.answer, ok: ok, why: k.explanation, options: k.options,
                  question: k.question, transcript: k.transcript });
  });
  var total = ns.length;
  var score = exam === "tcf" ? points : Math.round(correct * 699 / total);
  return { exam: exam, mock: Number(mock), section: section, status: "graded", correct: correct, total: total,
           points: points, max: max, score: score, scale: 699,
           nclc: nclcOf(exam, section, score), cefr: cefrOf(exam, section, score), review: review };
}

/* ---------------------------------------------------------------- attempts and results lookups */
function attemptsFor(code, exam, mock, section) {
  var tbl = table("Attempts"), list = [];
  tbl.rows.forEach(function (r, i) {
    if (norm(cell(tbl, r, "Code")).toUpperCase() === code && norm(cell(tbl, r, "Exam")) === exam &&
        Number(cell(tbl, r, "Mock")) === Number(mock) && norm(cell(tbl, r, "Section")) === section) {
      list.push({ index: i, id: norm(cell(tbl, r, "Attempt ID")), status: norm(cell(tbl, r, "Status")),
                  started: asTime(cell(tbl, r, "Started")), deadline: asTime(cell(tbl, r, "Deadline")),
                  saved: parseJSON(cell(tbl, r, "Saved"), {}) });
    }
  });
  return { tbl: tbl, list: list };
}

function resultsFor(code) {
  var tbl = table("Results"), list = [];
  tbl.rows.forEach(function (r, i) {
    if (norm(cell(tbl, r, "Code")).toUpperCase() === code) list.push({ index: i, row: r });
  });
  return { tbl: tbl, list: list };
}

function latestResultRow(code, exam, mock, section) {
  var rs = resultsFor(code), found = null;
  rs.list.forEach(function (x) {
    if (norm(cell(rs.tbl, x.row, "Exam")) === exam && Number(cell(rs.tbl, x.row, "Mock")) === Number(mock) &&
        norm(cell(rs.tbl, x.row, "Section")) === section) found = x;
  });
  return found ? { tbl: rs.tbl, index: found.index, row: found.row } : null;
}

function resultFromRow(tbl, row, withReview) {
  var exam = norm(cell(tbl, row, "Exam")), section = norm(cell(tbl, row, "Section")), mock = Number(cell(tbl, row, "Mock"));
  var base = { exam: exam, mock: mock, section: section, date: asTime(cell(tbl, row, "Date")) };
  if (section === "co" || section === "ce") {
    var stored = { status: "graded", correct: Number(cell(tbl, row, "Correct")), total: Number(cell(tbl, row, "Total")),
                   points: Number(cell(tbl, row, "Points")), score: Number(cell(tbl, row, "Score")), scale: 699,
                   nclc: Number(cell(tbl, row, "NCLC")) || 0, cefr: norm(cell(tbl, row, "CEFR")) };
    if (!withReview) return merge(base, stored);
    var g = grade(exam, mock, section, parseJSON(cell(tbl, row, "Answers or texts"), {}));
    return merge(base, g);
  }
  var markCell = cell(tbl, row, "Teacher mark");
  var comment = norm(cell(tbl, row, "Teacher comment"));
  if (markCell === "" || markCell == null || isNaN(Number(markCell))) return merge(base, { status: "pending" });
  var mark = Number(markCell);
  return merge(base, { status: "marked", score: mark, scale: scaleOf(exam, section),
                       nclc: nclcOf(exam, section, mark), cefr: cefrOf(exam, section, mark), comment: comment });
}

function merge(a, b) { var o = {}; Object.keys(a).forEach(function (k) { o[k] = a[k]; }); Object.keys(b).forEach(function (k) { o[k] = b[k]; }); return o; }

/* ---------------------------------------------------------------- actions */
var login = guarded(function (p) {
  var s = requireStudent(p);
  var attempts = {};
  var rs = resultsFor(s.code);
  rs.list.forEach(function (x) {
    var r = resultFromRow(rs.tbl, x.row, false);
    attempts[r.exam + "-" + r.mock + "-" + r.section] = summary(r);
  });
  var at = table("Attempts");
  at.rows.forEach(function (r) {
    if (norm(cell(at, r, "Code")).toUpperCase() !== s.code || norm(cell(at, r, "Status")) !== "started") return;
    var k = norm(cell(at, r, "Exam")) + "-" + Number(cell(at, r, "Mock")) + "-" + norm(cell(at, r, "Section"));
    attempts[k] = { status: "started" };
  });
  return { ok: true, name: s.name, access: s.access, retakes: s.retakes, attempts: attempts };
});

function summary(r) {
  if (r.status === "pending") return { status: "pending" };
  return { status: r.status === "marked" ? "marked" : "submitted", score: r.score, scale: r.scale, nclc: r.nclc, cefr: r.cefr };
}

var start = guarded(function (p) {
  var s = requireStudent(p);
  validSection(p);
  if (s.access.indexOf(p.exam) < 0) return { ok: false, error: "no_access" };
  return withLock(function () {
    var now = Date.now();
    var a = attemptsFor(s.code, p.exam, p.mock, p.section);
    var open = a.list.filter(function (x) { return x.status === "started"; }).pop();
    if (open) {
      if (now <= open.deadline + CONFIG.graceSeconds * 1000) {
        return { ok: true, resumed: true, remaining: Math.max(0, open.deadline - now), saved: open.saved };
      }
      var res = finalize(s, p.exam, p.mock, p.section, open, open.saved, a.tbl);
      return { ok: true, finished: true, result: res };
    }
    if (latestResultRow(s.code, p.exam, p.mock, p.section) && !s.retakes) return { ok: false, error: "already_done" };
    var duration = CONFIG.sections[p.exam][p.section] * 1000;
    if (p.section === "eo") duration += CONFIG.speakingExtraSeconds * 1000;
    var id = Utilities.getUuid();
    appendObj("Attempts", {
      "Attempt ID": id, "Code": s.code, "Name": s.name, "Exam": p.exam, "Mock": Number(p.mock), "Section": p.section,
      "Started": new Date(now), "Deadline": new Date(now + duration), "Status": "started", "Saved": "{}", "Last save": new Date(now)
    });
    return { ok: true, resumed: false, remaining: duration, saved: null };
  });
});

function savedFrom(p) {
  // recordings are only ever taken from the server's own uploads, never from the browser
  return { answers: p.answers || {}, played: p.played || [], texts: p.texts || {}, recs: {}, idx: p.idx || 0 };
}

var save = guarded(function (p) {
  var s = requireStudent(p);
  validSection(p);
  return withLock(function () {
    var a = attemptsFor(s.code, p.exam, p.mock, p.section);
    var open = a.list.filter(function (x) { return x.status === "started"; }).pop();
    if (!open) return { ok: false, error: "no_attempt" };
    if (Date.now() > open.deadline + CONFIG.graceSeconds * 1000) return { ok: false, error: "time_over" };
    var data = savedFrom(p);
    data.recs = open.saved.recs || {};
    setCells("Attempts", open.index, a.tbl, { "Saved": JSON.stringify(data), "Last save": new Date() });
    return { ok: true };
  });
});

var upload = guarded(function (p) {
  var s = requireStudent(p);
  validSection(p);
  if (p.section !== "eo") return { ok: false, error: "bad_request" };
  var a = attemptsFor(s.code, p.exam, p.mock, p.section);
  var open = a.list.filter(function (x) { return x.status === "started"; }).pop();
  if (!open) return { ok: false, error: "no_attempt" };
  var mime = norm(p.mime) || "audio/webm";
  var ext = mime.indexOf("mp4") >= 0 ? "m4a" : mime.indexOf("ogg") >= 0 ? "ogg" : "webm";
  var name = s.code + " " + p.exam.toUpperCase() + " " + p.mock + " EO task " + p.task + " " + new Date().toISOString().slice(0, 16).replace("T", " ") + "." + ext;
  var blob = Utilities.newBlob(Utilities.base64Decode(p.data || ""), mime, name);
  var file = studentFolder(s).createFile(blob);
  var url = file.getUrl();
  withLock(function () {
    var a2 = attemptsFor(s.code, p.exam, p.mock, p.section);
    var open2 = a2.list.filter(function (x) { return x.status === "started"; }).pop();
    if (!open2) return;
    var saved = open2.saved || {};
    saved.recs = saved.recs || {};
    saved.recs[p.task] = url;
    setCells("Attempts", open2.index, a2.tbl, { "Saved": JSON.stringify(saved), "Last save": new Date() });
  });
  return { ok: true, url: url };
});

function studentFolder(s) {
  var props = PropertiesService.getScriptProperties();
  var rootId = props.getProperty("recordingsFolderId");
  var root = null;
  if (rootId) { try { root = DriveApp.getFolderById(rootId); } catch (e) { root = null; } }
  if (!root) {
    var it = DriveApp.getFoldersByName(CONFIG.recordingsFolder);
    root = it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.recordingsFolder);
    props.setProperty("recordingsFolderId", root.getId());
  }
  var sub = s.code + " " + s.name;
  var it2 = root.getFoldersByName(sub);
  return it2.hasNext() ? it2.next() : root.createFolder(sub);
}

var submit = guarded(function (p) {
  var s = requireStudent(p);
  validSection(p);
  return withLock(function () {
    var a = attemptsFor(s.code, p.exam, p.mock, p.section);
    var open = a.list.filter(function (x) { return x.status === "started"; }).pop();
    if (!open) {
      var last = latestResultRow(s.code, p.exam, p.mock, p.section);
      if (last) return { ok: true, result: resultFromRow(last.tbl, last.row, true) };
      return { ok: false, error: "no_attempt" };
    }
    var inTime = Date.now() <= open.deadline + CONFIG.graceSeconds * 1000;
    var data = inTime ? savedFrom(p) : open.saved;
    data.recs = open.saved.recs || {};
    return { ok: true, result: finalize(s, p.exam, p.mock, p.section, open, data, a.tbl) };
  });
});

function finalize(s, exam, mock, section, open, data, attemptsTbl) {
  data = data || {};
  var row = { "Date": new Date(), "Code": s.code, "Name": s.name, "Exam": exam, "Mock": Number(mock), "Section": section,
              "Attempt ID": open.id };
  var res;
  if (section === "co" || section === "ce") {
    res = grade(exam, mock, section, data.answers || {});
    row["Correct"] = res.correct; row["Total"] = res.total; row["Points"] = res.points; row["Score"] = res.score;
    row["CEFR"] = res.cefr; row["NCLC"] = res.nclc || "<4"; row["Status"] = "Auto";
    row["Answers or texts"] = JSON.stringify(data.answers || {});
  } else if (section === "ee") {
    var texts = data.texts || {};
    row["Answers or texts"] = Object.keys(texts).sort().map(function (k) { return "— Task " + k + " —\n" + texts[k]; }).join("\n\n");
    row["Status"] = "To mark";
    res = { exam: exam, mock: Number(mock), section: section, status: "pending" };
  } else {
    var recs = data.recs || {};
    row["Recordings"] = Object.keys(recs).sort().map(function (k) { return "Task " + k + ": " + recs[k]; }).join("\n");
    row["Status"] = "To mark";
    res = { exam: exam, mock: Number(mock), section: section, status: "pending" };
  }
  appendObj("Results", row);
  setCells("Attempts", open.index, attemptsTbl, { "Status": "submitted", "Saved": JSON.stringify(data), "Last save": new Date() });
  return res;
}

var result = guarded(function (p) {
  var s = requireStudent(p);
  validSection(p);
  var last = latestResultRow(s.code, p.exam, p.mock, p.section);
  if (!last) return { ok: false, error: "no_result" };
  var r = resultFromRow(last.tbl, last.row, true);
  if ((p.section === "co" || p.section === "ce") && Number(cell(last.tbl, last.row, "Score")) !== r.score) {
    // a key was corrected in the sheet: keep the stored score in line
    withLock(function () {
      setCells("Results", last.index, last.tbl, { "Correct": r.correct, "Points": r.points, "Score": r.score, "CEFR": r.cefr, "NCLC": r.nclc || "<4" });
    });
  }
  return { ok: true, result: r };
});

var results = guarded(function (p) {
  var s = requireStudent(p);
  var rs = resultsFor(s.code), latest = {};
  rs.list.forEach(function (x) {
    var r = resultFromRow(rs.tbl, x.row, false);
    latest[r.exam + "-" + r.mock + "-" + r.section] = r;
  });
  var items = Object.keys(latest).map(function (k) { return latest[k]; });
  return { ok: true, name: s.name, items: items };
});

/* ---------------------------------------------------------------- one-time setup (run from the editor) */
function setup() {
  var book = ss();
  Object.keys(TABS).forEach(function (name) {
    var sh = book.getSheetByName(name) || book.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(TABS[name]);
    }
    sh.getRange(1, 1, 1, TABS[name].length).setFontWeight("bold").setBackground("#10233B").setFontColor("#FFFFFF");
    sh.setFrozenRows(1);
  });
  var st = book.getSheetByName("Students");
  st.getRange(2, 1, 500, 1).setNumberFormat("@");
  if (st.getLastRow() === 1) {
    st.appendRow([makeCode("PROF-"), "Gelo (test)", "TCF+TEF", "Yes", "Yes", "Teacher test code: can retake every test"]);
    st.appendRow([makeCode(""), "Jasleen Kaur", "TCF", "No", "Yes", ""]);
    st.appendRow([makeCode(""), "Nitasha Bains", "TEF", "No", "Yes", ""]);
  }
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(["TCF", "TEF", "TCF+TEF"], true).build();
  st.getRange(2, 3, 500, 1).setDataValidation(rule);
  var yn = SpreadsheetApp.newDataValidation().requireValueInList(["Yes", "No"], true).build();
  st.getRange(2, 4, 500, 2).setDataValidation(yn);
  var res = book.getSheetByName("Results");
  res.getRange(1, 14, 1, 2).setBackground("#2E7D6B");
  var first = book.getSheetByName("Sheet1") || book.getSheetByName("Feuille 1");
  if (first && first.getLastRow() === 0 && book.getSheets().length > 1) book.deleteSheet(first);
  return "Setup done";
}

function makeCode(prefix) {
  // starts with a letter and never uses E, so the sheet can't read it as a number
  var letters = "ABCDFGHJKLMNPQRSTUVWXYZ", abc = letters + "23456789";
  var s = letters.charAt(Math.floor(Math.random() * letters.length));
  for (var i = 0; i < 5; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
  return prefix + s;
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("FWY").addItem("Set up the tabs", "setup").addItem("New student code", "newCodeDialog").addToUi();
}

function newCodeDialog() {
  SpreadsheetApp.getUi().alert("New code: " + makeCode("") + "\n\nCopy it into the Students tab with the student's name.");
}
