/* FWY mock exams — single-page app (no build step). */
(function () {
  "use strict";

  var CFG = window.FWY_CONFIG || {};
  var I18N = window.FWY_I18N;
  var LV = window.FWY_LEVELS;
  var params = new URLSearchParams(location.search);
  var API = (params.get("api") || CFG.apiUrl || "").trim();
  var PREVIEW = !API || params.has("preview");
  var SECS = ["co", "ce", "ee", "eo"];
  var ICONS = {
    co: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="2.5" y="14" width="5" height="7" rx="2"/><rect x="16.5" y="14" width="5" height="7" rx="2"/></svg>',
    ce: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z"/><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/></svg>',
    ee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    eo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  /* ------------------------------------------------------------------ helpers */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  var lang = store.get("fwy.lang") || ((navigator.language || "fr").toLowerCase().indexOf("en") === 0 ? "en" : "fr");
  var scaleMode = store.get("fwy.scale", "nclc") === "cefr" ? "cefr" : "nclc"; // which level scale leads: NCLC or CECR

  /* light / dark theme: follows the device until the student picks one */
  var darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function currentTheme() {
    var a = document.documentElement.getAttribute("data-theme");
    if (a === "dark" || a === "light") return a;
    return darkQuery && darkQuery.matches ? "dark" : "light";
  }
  function syncThemeColor() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", currentTheme() === "dark" ? "#0A1222" : "#F3F6FB");
  }
  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    store.set("fwy.theme", next);
    syncThemeColor(); renderChrome();
  }
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener("change", function () { syncThemeColor(); renderChrome(); });

  function t(key, vars) {
    var s = I18N[lang][key];
    if (s === undefined) s = I18N.fr[key];
    if (s === undefined) return key;
    if (vars && typeof s === "string") s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] == null ? "" : vars[k]; });
    return lang === "fr" ? frTypo(s) : s;
  }

  function frTypo(s) {
    if (Array.isArray(s)) return s.map(frTypo);
    if (typeof s !== "string") return s;
    return s.replace(/ ([:;!?»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
  }

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "svg") el.innerHTML = v; // static icons only
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  function $(sel, el) { return (el || document).querySelector(sel); }
  var main = $("#main");

  function fmtClock(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    return m + ":" + String(s % 60).padStart(2, "0");
  }
  function fmtTotal(sec) {
    var m = Math.round(sec / 60);
    return Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0");
  }
  function secName(sec) { return t("sec_" + sec); }
  function examName(exam) { return exam === "tcf" ? "TCF Canada" : "TEF Canada"; }
  function key(exam, mock, sec) { return exam + "-" + mock + "-" + sec; }

  /* inline mini-markup: **bold**, [12] gap markers. Text only, never HTML. */
  function inline(text) {
    var out = [], re = /\*\*(.+?)\*\*|\[(\d+)\]|_{4,}/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      if (m[1]) out.push(h("strong", { text: m[1] }));
      else if (m[2]) out.push(h("span", { class: "gap", text: m[2] }));
      else out.push(h("span", { class: "gap", "aria-label": "…", text: "…" }));
      last = re.lastIndex;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  function blocks(body) {
    return String(body || "").trim().split(/\n\s*\n/).map(function (p) {
      var lines = p.split("\n");
      var isList = lines.every(function (l) { return /^\s*(- |\d+\. )/.test(l); });
      if (isList) {
        var ordered = /^\s*\d+\. /.test(lines[0]);
        return h(ordered ? "ol" : "ul", null, lines.map(function (l) { return h("li", null, inline(l.replace(/^\s*(- |\d+\. )/, ""))); }));
      }
      var kids = [];
      lines.forEach(function (l, i) { if (i) kids.push(h("br")); kids.push(inline(l)); });
      return h("p", null, kids);
    });
  }
  function renderDoc(doc) {
    if (!doc) return null;
    if (doc.kind === "multi") {
      return h("article", { class: "doc" }, h("h3", { text: doc.title }),
        h("div", { class: "multi" }, doc.items.map(function (it) {
          return h("div", { class: "item" }, h("b", { text: it.label }), h("strong", { text: it.title }), it.body);
        })));
    }
    var meta = doc.meta ? h("div", { class: "doc-meta" }, doc.meta.split(" · ").map(function (m) { return h("div", { text: m }); })) : null;
    return h("article", { class: "doc doc-" + doc.kind }, doc.title ? h("h3", { text: doc.title }) : null, meta, blocks(doc.body));
  }

  /* ------------------------------------------------------------------ API */
  function api(action, payload, timeoutMs) {
    var body = JSON.stringify(Object.assign({ action: action }, payload || {}));
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 30000) : null;
    return fetch(API, { method: "POST", body: body, signal: ctrl ? ctrl.signal : undefined, redirect: "follow" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (timer) clearTimeout(timer);
        if (!data || !data.ok) {
          var err = new Error((data && data.error) || "error");
          err.code = (data && data.error) || "error"; err.data = data;
          throw err;
        }
        return data;
      }, function (e) {
        if (timer) clearTimeout(timer);
        var err = new Error("network"); err.code = "network"; err.cause = e;
        throw err;
      });
  }

  /* ------------------------------------------------------------------ state */
  var catalog = null;
  var user = store.get("fwy.user", null); // {code, name, access:[], attempts:{}}
  var session = null; // active test

  function attemptOf(exam, mock, sec) {
    return (user && user.attempts && user.attempts[key(exam, mock, sec)]) || null;
  }
  function setAttempt(exam, mock, sec, info) {
    if (!user) return;
    user.attempts = user.attempts || {};
    user.attempts[key(exam, mock, sec)] = Object.assign({}, user.attempts[key(exam, mock, sec)] || {}, info);
    store.set("fwy.user", user);
  }

  function loadCatalog() {
    if (catalog) return Promise.resolve(catalog);
    return fetch("mocks/catalog.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (c) { catalog = c; return c; });
  }
  var sectionCache = {};
  function loadSection(exam, mock, sec) {
    var k = key(exam, mock, sec);
    if (sectionCache[k]) return Promise.resolve(sectionCache[k]);
    return fetch("mocks/" + exam + "-" + mock + "/" + sec + ".json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("missing"); return r.json(); })
      .then(function (d) { sectionCache[k] = d; return d; });
  }
  function sectionInfo(exam, mock, sec) {
    var e = catalog && catalog.exams.filter(function (x) { return x.id === exam; })[0];
    var m = e && e.mocks.filter(function (x) { return x.n === mock; })[0];
    return m ? m.sections[sec] : null;
  }

  function refreshUser() {
    if (!user || PREVIEW) return Promise.resolve(user);
    return api("login", { code: user.code }).then(function (d) {
      user = { code: user.code, name: d.name, access: d.access, attempts: d.attempts || {} };
      store.set("fwy.user", user);
      return user;
    }, function (e) {
      if (e.code === "unknown_code" || e.code === "inactive") { user = null; store.del("fwy.user"); }
      return user;
    });
  }

  /* ------------------------------------------------------------------ chrome */
  function renderChrome() {
    document.documentElement.lang = lang;
    $(".brand-title").textContent = t("siteTitle");
    var acts = $("#topActions");
    acts.replaceChildren();
    if (user) {
      acts.append(h("span", { class: "who", text: user.name || user.code }));
      acts.append(h("a", { class: "tb", href: "#/results", text: t("myResults") }));
      acts.append(h("button", { class: "tb icon", type: "button", title: t("signOut"), "aria-label": t("signOut"), svg: ICONS.out, onclick: function () { signOut(); } }));
    } else {
      acts.append(h("button", { class: "tb primary", type: "button", text: t("enterCode"), onclick: function () { askCode(function () { route(); }); } }));
    }
    var dark = currentTheme() === "dark";
    acts.append(h("button", { class: "tb icon", type: "button", "aria-pressed": String(dark), title: dark ? t("themeLight") : t("themeDark"),
      "aria-label": t("themeDark"), svg: dark ? ICONS.sun : ICONS.moon, onclick: toggleTheme }));
    acts.append(h("button", { class: "tb icon", type: "button", text: lang === "fr" ? "EN" : "FR", title: t("langSwitch"), "aria-label": t("langSwitch"), lang: lang === "fr" ? "en" : "fr", onclick: function () {
      lang = lang === "fr" ? "en" : "fr"; store.set("fwy.lang", lang); renderChrome(); route(true);
    } }));
    var banner = $("#previewBanner");
    banner.hidden = !PREVIEW;
    banner.textContent = t("previewBanner");
    var c = CFG.contact || {};
    $("#foot").replaceChildren(h("div", { class: "wrap" },
      h("div", null, h("strong", { text: "FrenchWithYou" }), "\u2002", t("footerFree")),
      h("div", { class: "contacts" },
        c.whatsapp ? h("a", { href: "https://wa.me/" + c.whatsapp.replace(/\D/g, ""), text: "WhatsApp " + c.whatsapp }) : null,
        c.email ? h("a", { href: "mailto:" + c.email, text: c.email }) : null,
        c.telegram ? h("a", { href: "https://t.me/" + c.telegram.replace("@", ""), text: "Telegram " + c.telegram }) : null)));
  }

  function signOut() {
    if (session && !confirmLeave()) return;
    user = null; store.del("fwy.user"); renderChrome(); location.hash = "#/"; route();
  }

  /* ------------------------------------------------------------------ dialogs */
  function dialog(content, onClose) {
    var root = $("#dialog-root");
    var back = h("div", { class: "dlg-back", role: "presentation" });
    var box = h("div", { class: "dlg", role: "dialog", "aria-modal": "true" }, content);
    back.append(box);
    function close() { back.remove(); document.removeEventListener("keydown", esc); if (onClose) onClose(); }
    function esc(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", esc);
    root.append(back);
    var f = box.querySelector("input, button");
    if (f) f.focus();
    return close;
  }

  function confirmDialog(title, text, okLabel, cancelLabel, onOk) {
    var close = dialog([
      h("h2", { text: title }),
      text ? h("p", { text: text }) : null,
      h("div", { class: "btn-row" },
        h("button", { class: "btn btn-primary", type: "button", text: okLabel, onclick: function () { close(); onOk(); } }),
        h("button", { class: "btn btn-ghost", type: "button", text: cancelLabel, onclick: function () { close(); } }))
    ]);
  }

  function askCode(after) {
    var input = h("input", { id: "codeIn", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", maxlength: "20", inputmode: "text" });
    var err = h("div", { class: "err", hidden: true, role: "alert" });
    var btn = h("button", { class: "btn btn-primary", type: "submit", text: t("codeContinue") });
    var form = h("form", { onsubmit: function (e) {
      e.preventDefault();
      var code = input.value.trim().toUpperCase().replace(/\s+/g, "");
      if (!code) return;
      btn.disabled = true; err.hidden = true;
      if (PREVIEW) { done({ name: code, access: ["tcf", "tef"], attempts: {} }); return; }
      api("login", { code: code }).then(done, function (e2) {
        btn.disabled = false; err.hidden = false;
        err.textContent = e2.code === "unknown_code" ? t("codeUnknown") : e2.code === "inactive" ? t("codeInactive") : t("netError");
      });
      function done(d) {
        user = { code: code, name: d.name, access: d.access, attempts: d.attempts || {} };
        store.set("fwy.user", user); close(); renderChrome(); if (after) after();
      }
    } },
      h("h2", { text: t("codeTitle") }),
      h("p", { text: t("codeText") }),
      h("div", { class: "field" }, h("label", { for: "codeIn", text: t("codeLabel") }), input),
      err,
      h("div", { class: "btn-row" }, btn, h("button", { class: "btn btn-ghost", type: "button", text: t("codeCancel"), onclick: function () { close(); } })));
    var close = dialog(form);
    input.focus();
  }

  /* ------------------------------------------------------------------ views: shell */
  function show(nodes) {
    document.body.classList.toggle("in-test", !!(session && !session.finished));
    main.replaceChildren();
    append(main, nodes);
    window.scrollTo(0, 0);
  }
  function loadingView() { show(h("div", { class: "loading" }, h("div", { class: "spinner" }), t("loading"))); }
  function errorView(msg, retry) {
    show(h("div", { class: "wrap page" }, h("div", { class: "notice err", role: "alert" }, msg),
      retry ? h("p", null, h("button", { class: "btn btn-ghost", type: "button", text: t("tryAgain"), onclick: retry })) : null));
  }
  function crumbs(items) {
    var out = [];
    items.forEach(function (it, i) {
      if (i) out.push(h("span", { class: "sep", "aria-hidden": "true", text: "/" }));
      out.push(it.href ? h("a", { href: it.href, text: it.text }) : h("span", { text: it.text }));
    });
    return h("nav", { class: "crumbs", "aria-label": "Fil d'Ariane" }, out);
  }

  /* ------------------------------------------------------------------ levels: NCLC and CECR */
  var CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
  var NCLC_TO_CEFR = { 4: "A2", 5: "B1", 6: "B1", 7: "B2", 8: "B2", 9: "C1", 10: "C1" };
  var CEFR_TO_NCLC = { A1: "< 4", A2: "4", B1: "5–6", B2: "7–8", C1: "9–10", C2: "10+" };

  function scaleSwitch(onChange) {
    var make = function (mode, label) {
      return h("button", { type: "button", "aria-pressed": String(scaleMode === mode), text: label, onclick: function () {
        if (scaleMode === mode) return;
        scaleMode = mode; store.set("fwy.scale", mode); onChange();
      } });
    };
    return h("div", { class: "seg", role: "group", "aria-label": t("scaleLabel") }, make("nclc", "NCLC"), make("cefr", t("cefrShort")));
  }

  /* the level staircase on the home page */
  var stairsAnimated = false;
  function levelStairs() {
    var card = h("div", { class: "stairs-card" });
    var selected = null;
    function draw(animate) {
      var isN = scaleMode === "nclc";
      var levels = isN ? [4, 5, 6, 7, 8, 9, 10] : CEFR_ORDER;
      var target = isN ? 7 : "B2";
      if (selected == null || levels.indexOf(selected) < 0) selected = target;
      var n = levels.length;
      var cap = h("div", { class: "stairs-cap", "aria-live": "polite" });
      var showCaption = function (lv) {
        var cefr = isN ? NCLC_TO_CEFR[lv] : lv;
        var eq = isN ? t("approx", { l: cefr }) : t("approx", { l: "NCLC " + CEFR_TO_NCLC[lv] });
        cap.replaceChildren(h("div", { class: "lv" }, h("b", { text: (isN ? "NCLC " : "") + lv }), h("span", { text: eq + ", " + t("cefrName_" + cefr).toLowerCase() })),
          h("p", { text: t("cefrDesc_" + cefr) }));
      };
      var stairs = h("div", { class: "stairs" + (animate ? " rise" : ""), style: "--n:" + n, role: "group", "aria-label": isN ? "NCLC 4–10" : "A1–C2", onmouseleave: function () { showCaption(selected); } });
      levels.forEach(function (lv, i) {
        var k = Math.round(16 + i * 84 / (n - 1));
        var step = h("button", { type: "button", class: "step" + (k > 50 ? " on-dark" : "") + (lv === target ? " target" : ""),
          style: "--h:" + Math.round(22 + i * 78 / (n - 1)) + "%;--k:" + k + "%;--i:" + i,
          "aria-pressed": String(lv === selected), "aria-label": (isN ? "NCLC " : t("cefrShort") + " ") + lv,
          onmouseenter: function () { showCaption(lv); },
          onclick: function () {
            selected = lv;
            Array.prototype.forEach.call(stairs.children, function (b) { b.setAttribute("aria-pressed", String(b === step)); });
            showCaption(lv);
          } }, h("b", { text: String(lv) }));
        stairs.append(step);
      });
      showCaption(selected);
      card.replaceChildren(
        h("div", { class: "stairs-top" }, h("h2", { text: t("stairsTitle") }), scaleSwitch(function () { draw(false); })),
        stairs, cap,
        h("div", { class: "stairs-foot" },
          h("span", { class: "tgt" }, t("ribbonTarget") + (lang === "fr" ? " : " : ": "), h("b", { text: isN ? "NCLC 7" : "B2" }), isN ? "" : " (" + t("approx", { l: "NCLC 7" }) + ")"),
          h("span", { text: t("stairsHint") })));
    }
    draw(!stairsAnimated);
    stairsAnimated = true;
    return card;
  }

  function finished(a) { return a && (a.status === "submitted" || a.status === "marked" || a.status === "pending"); }

  function statusBits(exam, mock, sec, info) {
    var a = attemptOf(exam, mock, sec);
    if (!info.ready && !PREVIEW) return h("span", { class: "pill pill-soon", text: t("status_soon") });
    if (!a) return h("span", { class: "pill pill-todo", text: t("status_todo") });
    if (a.status === "started") return h("span", { class: "pill pill-started", text: t("status_started") });
    if (a.status === "pending") return h("span", { class: "pill pill-pending", text: t("status_pending") });
    if (a.score == null) return h("span", { class: "pill pill-done", svg: ICONS.check }, t("status_done"));
    var done = h("span", { class: "pill pill-done", title: t("status_done") });
    done.innerHTML = ICONS.check; done.append(String(a.score) + (a.scale === 20 ? "/20" : ""));
    return [done,
      h("span", { class: "chip" }, h("small", { text: "NCLC" }), a.nclc ? String(a.nclc) : "< 4"),
      a.cefr ? h("span", { class: "chip", text: a.cefr }) : null];
  }

  function viewHome() {
    var hero = h("section", { class: "hero" }, h("div", { class: "wrap hero-grid" },
      h("div", null, h("h1", { text: t("heroTitle") }), h("p", { text: t("heroText") }),
        !user ? h("div", { class: "btn-row" }, h("button", { class: "btn btn-primary", type: "button", text: t("enterCode"), onclick: function () { askCode(function () { route(); }); } })) : null),
      levelStairs()));
    var panels = catalog.exams.map(function (ex) {
      var total = 0, mocks = ex.mocks;
      if (mocks[0]) SECS.forEach(function (s) { total += mocks[0].sections[s].duration; });
      return h("section", { class: "exam", "aria-labelledby": "h-" + ex.id },
        h("div", { class: "exam-head" }, h("h2", { id: "h-" + ex.id, text: ex.name }), h("span", { class: "meta", text: t("examTotal", { n: 4, t: fmtTotal(total) }) })),
        mocks.map(function (m) {
          var done = SECS.filter(function (s) { return finished(attemptOf(ex.id, m.n, s)); }).length;
          return h("div", { class: "mock" },
            h("div", { class: "mock-head" }, h("h3", { text: t("mockTitle", { n: m.n }) }),
              h("span", { class: "mock-prog", text: t("mockProgress", { d: done, n: SECS.length }) }),
              h("span", { class: "mini-bar", "aria-hidden": "true" }, h("i", { style: "width:" + (done / SECS.length * 100) + "%" }))),
            h("div", { class: "tiles" }, SECS.map(function (s) {
              var info = m.sections[s];
              var metaKey = s === "co" || s === "ce" ? "secMetaQ" : ex.id === "tcf" ? "secMetaT" : "secMetaS";
              return h("a", { class: "tile acc-" + s, href: "#/m/" + ex.id + "-" + m.n + "/" + s },
                h("span", { class: "ico", svg: ICONS[s] }),
                h("span", { class: "tile-name", text: secName(s) }),
                h("span", { class: "tile-sub", text: t(metaKey, { q: info.count, m: Math.round(info.duration / 60) }) }),
                h("span", { class: "tile-foot" }, statusBits(ex.id, m.n, s, info)));
            })));
        }),
        h("p", { class: "more-soon", text: t("moreSoon") }));
    });
    show([hero, h("div", { class: "wrap" }, h("div", { class: "exams" }, panels))]);
  }

  /* ------------------------------------------------------------------ section intro */
  function viewIntro(exam, mock, sec) {
    var info = sectionInfo(exam, mock, sec);
    if (!info) { location.hash = "#/"; return; }
    var a = attemptOf(exam, mock, sec);
    var minutes = Math.round(info.duration / 60);
    var countLabel = sec === "co" || sec === "ce" ? t("factQuestions") : exam === "tcf" ? t("factTasks") : t("factSections");
    var scaleFact = exam === "tcf" && (sec === "ee" || sec === "eo") ? ["20", t("factScale20")] : ["699", exam === "tcf" ? t("factPoints") : t("factScale699")];
    var rules = t("rules_" + sec).map(function (r) { return h("li", { text: r.replace("{m}", minutes) }); });
    var action;

    if (!info.ready && !PREVIEW) {
      action = h("div", { class: "notice warn", text: t("notReady") });
    } else if (a && (a.status === "submitted" || a.status === "pending" || a.status === "marked") && !(user && user.retakes)) {
      action = h("div", null, h("div", { class: "notice ok", text: t("alreadyDone") }), h("p", null,
        h("a", { class: "btn btn-primary", href: "#/m/" + exam + "-" + mock + "/" + sec + "/result", text: t("seeResult") })));
    } else if (user && user.access && user.access.indexOf(exam) < 0) {
      action = h("div", { class: "notice err", text: t("noAccess") });
    } else {
      var startBtn = h("button", { class: "btn btn-primary", type: "button", text: a && a.status === "started" ? t("resume") : t("start") });
      var chk = h("input", { type: "checkbox", id: "understand" });
      if (!(a && a.status === "started")) { startBtn.disabled = true; chk.addEventListener("change", function () { startBtn.disabled = !chk.checked; }); }
      startBtn.addEventListener("click", function () {
        if (!user) { askCode(function () { location.hash = "#/m/" + exam + "-" + mock + "/" + sec + "/test"; }); return; }
        location.hash = "#/m/" + exam + "-" + mock + "/" + sec + "/test";
      });
      var device = null;
      if (sec === "co") device = soundTestBlock();
      if (sec === "eo") device = micTestBlock();
      action = h("div", null, device,
        a && a.status === "started" ? null : h("label", { class: "check", for: "understand" }, chk, h("span", { text: t("understand") })),
        !user ? h("p", { class: "muted", text: t("needCode") }) : null,
        h("div", { class: "btn-row" }, startBtn));
    }

    show(h("div", { class: "wrap page narrow acc-" + sec },
      crumbs([{ href: "#/", text: t("home") }, { text: examName(exam) + ", " + t("mockTitle", { n: mock }).toLowerCase() }]),
      h("div", { class: "sec-band" },
        h("span", { class: "ico", svg: ICONS[sec] }),
        h("div", { class: "exam-name", text: examName(exam) + ", " + t("mockTitle", { n: mock }).toLowerCase() }),
        h("h1", { text: secName(sec) }),
        h("div", { class: "facts" },
          h("div", { class: "fact" }, h("b", { text: info.count }), h("span", { text: countLabel })),
          h("div", { class: "fact" }, h("b", { text: minutes }), h("span", { text: t("factMinutes") })),
          h("div", { class: "fact" }, h("b", { text: scaleFact[0] }), h("span", { text: scaleFact[1] })))),
      h("div", { class: "intro-body" },
        h("h2", { text: t("howItWorks") }), h("ul", { class: "rules" }, rules),
        h("div", { class: "tip" }, h("b", { text: t("advice") }), h("span", { text: t("tip_" + exam + "_" + sec) })),
        action)));
  }

  function soundTestBlock() {
    var msg = h("p", { class: "muted", hidden: true, text: t("soundTestOk") });
    return h("div", { class: "btn-row device" }, h("button", { class: "btn btn-ghost btn-small", type: "button", text: t("soundTest"), onclick: function () {
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext; var ctx = new Ctx();
        [0, 0.35, 0.7].forEach(function (d, i) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.frequency.value = [523, 659, 784][i]; o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, ctx.currentTime + d); g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + d + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.3);
          o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + 0.32);
        });
      } catch (e) { /* no audio API */ }
      msg.hidden = false;
    } }), msg);
  }

  function pickMime() {
    if (!window.MediaRecorder) return null;
    var types = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
    for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) return types[i];
    return "";
  }

  function micTestBlock() {
    var msg = h("p", { class: "muted", hidden: true, role: "status" });
    var audio = h("audio", { controls: true, hidden: true, style: "width:100%;max-width:420px" });
    var btn = h("button", { class: "btn btn-ghost btn-small", type: "button", text: t("micTest"), onclick: function () {
      if (!navigator.mediaDevices || pickMime() === null) { msg.hidden = false; msg.textContent = t("micUnsupported"); return; }
      btn.disabled = true;
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var mime = pickMime(); var chunks = [];
        var rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          stream.getTracks().forEach(function (tr) { tr.stop(); });
          audio.src = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
          audio.hidden = false; msg.textContent = t("micTestPlay"); btn.disabled = false;
          audio.play().catch(function () { /* user can press play */ });
        };
        msg.hidden = false; msg.textContent = t("micTesting");
        rec.start(); setTimeout(function () { rec.stop(); }, 3000);
      }, function () { msg.hidden = false; msg.textContent = t("micDenied"); btn.disabled = false; });
    } });
    return h("div", { class: "device" }, h("div", { class: "btn-row" }, btn), msg, audio);
  }

  /* ------------------------------------------------------------------ test: start/resume */
  function localKey(exam, mock, sec) { return "fwy.a." + (user ? user.code : "anon") + "." + key(exam, mock, sec); }

  function viewTest(exam, mock, sec) {
    var info = sectionInfo(exam, mock, sec);
    if (!info) { location.hash = "#/"; return; }
    if (!user) { askCode(function () { route(); }); show(h("div", { class: "wrap page" }, h("div", { class: "notice", text: t("needCode") }))); return; }
    if (!info.ready && !PREVIEW) { location.hash = "#/m/" + exam + "-" + mock + "/" + sec; return; }
    loadingView();
    loadSection(exam, mock, sec).then(function (data) {
      var local = store.get(localKey(exam, mock, sec), null);
      if (PREVIEW) {
        var pv = store.get("fwy.preview." + key(exam, mock, sec), null);
        if (!pv || pv.deadline < Date.now()) { pv = { deadline: Date.now() + data.duration * 1000 }; store.set("fwy.preview." + key(exam, mock, sec), pv); local = null; }
        return begin(data, { remaining: pv.deadline - Date.now(), saved: null }, local);
      }
      return api("start", { code: user.code, exam: exam, mock: mock, section: sec }).then(function (d) {
        if (d.finished) {
          setAttempt(exam, mock, sec, attemptSummary(d.result));
          lastResult[key(exam, mock, sec)] = d.result;
          location.hash = "#/m/" + exam + "-" + mock + "/" + sec + "/result";
          return;
        }
        setAttempt(exam, mock, sec, { status: "started" });
        if (!d.resumed) local = null;
        return begin(data, d, local);
      });
    }).catch(function (e) {
      if (e.code === "already_done") { setAttempt(exam, mock, sec, { status: "submitted" }); location.hash = "#/m/" + exam + "-" + mock + "/" + sec + "/result"; return; }
      if (e.code === "no_access") { errorView(t("noAccess")); return; }
      errorView(t("netError"), function () { route(); });
    });

    function begin(data, startInfo, local) {
      var saved = startInfo.saved || {};
      var base = local || {};
      session = {
        exam: exam, mock: mock, sec: sec, data: data,
        deadline: Date.now() + Math.max(0, startInfo.remaining),
        answers: Object.assign({}, saved.answers || {}, base.answers || {}),
        played: (base.played || saved.played || []).slice(),
        texts: Object.assign({}, saved.texts || {}, base.texts || {}),
        recs: Object.assign({}, saved.recs || {}, base.recs || {}),
        idx: base.idx != null ? base.idx : (saved.idx || 0),
        dirty: false, lastSave: Date.now(), timers: [], finished: false
      };
      if (sec === "co") session.idx = Math.max(session.idx, firstUnplayed());
      if (sec === "co" || sec === "ce") renderMcq();
      else if (sec === "ee") renderWriting();
      else renderSpeaking();
      startClock();
    }
  }

  function firstUnplayed() {
    var screens = session.data.screens;
    for (var i = 0; i < screens.length; i++) if (session.played.indexOf(screens[i].id) < 0) return i;
    return screens.length - 1;
  }

  function persist() {
    if (!session) return;
    store.set(localKey(session.exam, session.mock, session.sec), {
      answers: session.answers, played: session.played, texts: session.texts, recs: session.recs, idx: session.idx
    });
    session.dirty = true;
  }

  function payload() {
    return { code: user.code, exam: session.exam, mock: session.mock, section: session.sec,
      answers: session.answers, played: session.played, texts: session.texts, recs: session.recs, idx: session.idx };
  }

  function serverSave(force) {
    if (!session || PREVIEW || session.finished) return;
    if (!force && (!session.dirty || Date.now() - session.lastSave < 40000)) return;
    session.dirty = false; session.lastSave = Date.now();
    api("save", payload()).catch(function () { session.dirty = true; });
  }

  function beacon() {
    if (!session || PREVIEW || session.finished || !navigator.sendBeacon) return;
    try { navigator.sendBeacon(API, JSON.stringify(Object.assign({ action: "save" }, payload()))); } catch (e) { /* ignore */ }
  }
  window.addEventListener("pagehide", beacon);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") beacon(); });
  window.addEventListener("beforeunload", function (e) {
    if (session && !session.finished && !PREVIEW) { e.preventDefault(); e.returnValue = ""; }
  });

  function startClock() {
    var tick = function () {
      if (!session) return;
      var left = session.deadline - Date.now();
      var el = $("#clockVal"), bar = $("#clockBar"), box = $("#clock");
      if (el) el.textContent = fmtClock(left);
      if (bar) bar.style.width = Math.max(0, Math.min(100, left / (session.data.duration * 10))) + "%";
      if (box) box.classList.toggle("low", left < 5 * 60000);
      serverSave(false);
      if (left <= 0 && !session.finished && session.sec !== "eo") finishSection(true);
    };
    tick();
    session.timers.push(setInterval(tick, 500));
  }

  function stopSession() {
    if (!session) return;
    session.timers.forEach(function (x) { clearInterval(x); clearTimeout(x); });
    if (session.audio) { try { session.audio.pause(); } catch (e) { /* ignore */ } }
    if (session.recorder && session.recorder.state === "recording") { try { session.recorder.stop(); } catch (e) { /* ignore */ } }
    if (session.stream) session.stream.getTracks().forEach(function (tr) { tr.stop(); });
  }

  function railName() {
    return h("div", { class: "rail-name" }, h("span", { class: "ico", svg: ICONS[session.sec] }),
      h("div", null, h("b", { text: secName(session.sec) }), h("span", { text: examName(session.exam) + ", " + t("mockTitle", { n: session.mock }).toLowerCase() })));
  }
  function railClock() {
    return h("div", { class: "timer", id: "clock", role: "timer", "aria-live": "off" },
      h("div", { class: "lbl", text: t("timeLeft") }), h("div", { class: "val", id: "clockVal", text: fmtClock(session.deadline - Date.now()) }),
      h("div", { class: "bar" }, h("i", { id: "clockBar", style: "width:" + Math.max(0, Math.min(100, (session.deadline - Date.now()) / (session.data.duration * 10))) + "%" })));
  }

  /* ------------------------------------------------------------------ test: multiple choice (CO, CE) */
  function allQuestions() {
    var list = [];
    session.data.screens.forEach(function (s, i) { s.questions.forEach(function (q) { list.push({ n: q.n, screen: i }); }); });
    return list;
  }
  function answeredCount() { return Object.keys(session.answers).filter(function (k) { return session.answers[k]; }).length; }

  function renderMcq() {
    var data = session.data, s = data.screens[session.idx];
    var isCO = session.sec === "co";
    var total = data.count;

    // rail
    var grid = h("div", { class: "grid" }, allQuestions().map(function (q) {
      var cls = (q.screen === session.idx ? "cur" : session.answers[q.n] ? "done" : "");
      if (isCO) return h("span", { class: cls, text: q.n, "aria-hidden": "true" });
      return h("button", { type: "button", class: cls, text: q.n, "aria-label": t("question") + " " + q.n, onclick: function () { go(q.screen); } });
    }));
    var rail = h("aside", { class: "rail" }, railName(), railClock(),
      h("div", { class: "prog" }, h("div", { class: "lbl" }, h("span", { text: t("progress") }), h("b", { id: "progTxt", text: answeredCount() + " / " + total })),
        h("div", { class: "bar" }, h("i", { id: "progBar", style: "width:" + (answeredCount() / total * 100) + "%" }))),
      h("div", { class: "rail-grid" }, grid, h("div", { class: "legend" },
        h("span", null, h("i", { class: "l-cur" }), t("gridLegendCurrent")), h("span", null, h("i", { class: "l-done" }), t("gridLegendDone")), h("span", null, h("i"), t("gridLegendTodo")))));

    // paper
    var ns = s.questions.map(function (q) { return q.n; });
    var head = h("div", { class: "qhead" },
      h("div", { class: "qnum" }, (ns.length > 1 ? t("question") + "s " : t("question") + " "), h("b", { text: ns.length > 1 ? ns[0] + "–" + ns[ns.length - 1] : String(ns[0]) }), " " + t("ofTotal", { t: total })),
      s.part ? h("div", { class: "part-label", text: s.part }) : null);
    var paper = h("section", { class: "paper", "aria-label": secName(session.sec) }, head);

    if (isCO) paper.append(listenPanel(s));
    if (s.topic) paper.append(h("div", { class: "qblock" }, h("div", { class: "topic", text: s.topic }), h("p", { style: "margin:8px 0 0" }, h("span", { class: "speaker", text: s.speaker }))));
    if (s.image) paper.append(h("div", { class: "picture" }, h("img", { src: "mocks/" + session.exam + "-" + session.mock + "/" + s.image, alt: s.alt || "" })));
    if (s.doc) paper.append(renderDoc(s.doc));
    if (s.gap) paper.append(h("div", { class: "gap-sentence" }, inline(s.gap)));
    if (s.statement) paper.append(h("div", { class: "statement", text: s.statement }));

    s.questions.forEach(function (q) { paper.append(questionBlock(s, q)); });

    // nav
    var last = session.idx === data.screens.length - 1;
    var nav = h("div", { class: "navbar" },
      isCO ? h("span") : h("button", { class: "btn btn-ghost", type: "button", text: t("previous"), disabled: session.idx === 0, onclick: function () { go(session.idx - 1); } }),
      last ? h("button", { class: "btn btn-primary", type: "button", text: t("finish"), onclick: function () { askFinish(); } })
        : h("button", { class: "btn btn-primary", type: "button", text: t("next"), onclick: function () { next(); } }));
    paper.append(nav);
    if (!isCO && !last) paper.append(h("div", { style: "text-align:right" }, h("button", { class: "btn btn-ghost btn-small", type: "button", text: t("finish"), onclick: function () { askFinish(); } })));

    show(h("div", { class: "wrap" }, h("div", { class: "test acc-" + session.sec }, rail, paper)));
    updateListen();
  }

  function questionBlock(s, q) {
    var block = h("div", { class: "qblock", role: "radiogroup", "aria-label": t("question") + " " + q.n });
    var multi = s.questions.length > 1;
    if (q.q) block.append(h("p", { class: "qtext" }, multi ? h("small", { text: t("question") + " " + q.n }) : null, q.q));
    var letters = ["A", "B", "C", "D"];
    var opts;
    if (s.optionImages) {
      opts = h("div", { class: "img-opts" }, s.optionImages.map(function (src, i) {
        return h("button", { type: "button", class: "img-opt", role: "radio", "aria-checked": String(session.answers[q.n] === letters[i]), "data-n": q.n, "data-l": letters[i], onclick: pick },
          h("span", { class: "L", text: letters[i] }), h("img", { src: "mocks/" + session.exam + "-" + session.mock + "/" + src, alt: (s.optionAlts && s.optionAlts[i]) || letters[i] }));
      }));
      if (s.kind === "pictures") block.prepend(h("p", { class: "hint", text: t("picturesHint") }));
    } else if (q.options) {
      var longest = Math.max.apply(null, q.options.map(function (o) { return o.length; }));
      opts = h("div", { class: "opts" + (longest < 34 ? " two" : "") }, q.options.map(function (o, i) {
        return h("button", { type: "button", class: "opt", role: "radio", "aria-checked": String(session.answers[q.n] === letters[i]), "data-n": q.n, "data-l": letters[i], onclick: pick },
          h("span", { class: "L", text: letters[i] }), h("span", { class: "T", text: o }));
      }));
    } else {
      block.append(h("p", { class: "hint", style: "margin-bottom:12px", text: s.kind === "picture" ? t("pictureHint") : t("audioOptionsHint") }));
      opts = h("div", { class: "letters" }, letters.map(function (L) {
        return h("button", { type: "button", class: "opt", role: "radio", "aria-label": L, "aria-checked": String(session.answers[q.n] === L), "data-n": q.n, "data-l": L, onclick: pick }, h("span", { class: "L", text: L }));
      }));
    }
    block.append(opts);
    return block;
  }

  function pick(e) {
    var btn = e.currentTarget, n = btn.getAttribute("data-n"), L = btn.getAttribute("data-l");
    session.answers[n] = L;
    var group = btn.parentNode;
    Array.prototype.forEach.call(group.children, function (b) { b.setAttribute("aria-checked", String(b === btn)); });
    persist();
    var total = session.data.count, c = answeredCount();
    var pt = $("#progTxt"), pb = $("#progBar");
    if (pt) pt.textContent = c + " / " + total;
    if (pb) pb.style.width = (c / total * 100) + "%";
    var cell = Array.prototype.filter.call(document.querySelectorAll(".grid > *"), function (x) { return x.textContent === String(n); })[0];
    if (cell && !cell.classList.contains("cur")) cell.classList.add("done");
  }

  function go(i) {
    if (!session || i < 0 || i >= session.data.screens.length) return;
    session.idx = i; persist(); renderMcq();
    var p = $(".paper"); if (p) p.scrollIntoView({ block: "start" });
  }

  function next() {
    if (session.sec === "co") {
      var s = session.data.screens[session.idx];
      var st = session.listenState;
      if (session.played.indexOf(s.id) < 0 && st !== "missing") {
        confirmDialog(t("skipTitle"), t("skipText"), t("skipConfirm"), t("keepGoing"), function () {
          session.played.push(s.id); advanceCO();
        });
        return;
      }
      advanceCO();
      return;
    }
    go(session.idx + 1);
  }

  function advanceCO() {
    if (session.audio) { try { session.audio.pause(); } catch (e) { /* ignore */ } session.audio = null; }
    session.idx += 1; persist();
    renderMcq();
    startAudio(); // called inside the click → allowed to play
  }

  /* listening: one play only */
  function listenPanel() {
    return h("div", { class: "listen", id: "listen", role: "status", "aria-live": "polite" },
      h("div", { class: "eq", "aria-hidden": "true" }, h("i"), h("i"), h("i"), h("i")),
      h("div", null, h("div", { class: "state", id: "listenState" }), h("div", { class: "sub", text: t("listenOnce") })),
      h("button", { class: "btn btn-primary btn-small", type: "button", id: "listenBtn", hidden: true, text: t("listenTap"), onclick: function () { startAudio(true); } }));
  }

  function updateListen() {
    if (!session || session.sec !== "co") return;
    var s = session.data.screens[session.idx];
    var st = session.listenState;
    if (session.listenFor !== s.id) st = session.played.indexOf(s.id) >= 0 ? "done" : "idle";
    var box = $("#listen"), label = $("#listenState"), btn = $("#listenBtn");
    if (!box) return;
    box.classList.toggle("playing", st === "playing");
    box.classList.toggle("done", st === "done");
    var text = { idle: t("listenReady"), loading: t("loading"), playing: t("listenPlaying"), done: t("listenDone"), tap: t("listenReady"),
      paused: t("listenPaused"), error: t("listenError"), missing: t("listenMissing") }[st] || "";
    label.textContent = text;
    btn.hidden = !(st === "idle" || st === "tap" || st === "paused" || st === "error");
  }

  function startAudio(fromTap) {
    var s = session.data.screens[session.idx];
    if (!s.audio) return;
    if (session.played.indexOf(s.id) >= 0 && !(session.audio && session.listenFor === s.id && session.listenState === "paused")) { session.listenFor = s.id; session.listenState = "done"; updateListen(); return; }
    if (session.audio && session.listenFor === s.id && session.listenState === "paused") {
      session.audio.play().catch(function () { /* stay paused */ });
      return;
    }
    var a = new Audio();
    a.preload = "auto";
    a.src = "mocks/" + session.exam + "-" + session.mock + "/" + s.audio;
    session.audio = a; session.listenFor = s.id; session.listenState = "loading";
    var mine = function () { return session && session.audio === a; };
    a.addEventListener("playing", function () {
      if (!mine()) return;
      if (session.played.indexOf(s.id) < 0) { session.played.push(s.id); persist(); }
      session.listenState = "playing"; updateListen();
    });
    a.addEventListener("pause", function () { if (mine() && !a.ended && session.listenState === "playing") { session.listenState = "paused"; updateListen(); } });
    a.addEventListener("ended", function () { if (mine()) { session.listenState = "done"; updateListen(); } });
    a.addEventListener("error", function () {
      if (!mine()) return;
      session.listenState = session.played.indexOf(s.id) >= 0 ? "done" : (PREVIEW ? "missing" : "error"); updateListen();
    });
    var p = a.play();
    if (p && p.catch) p.catch(function (err) {
      if (!mine()) return;
      if (err && err.name === "NotAllowedError") { session.listenState = "tap"; updateListen(); }
    });
    updateListen();
    preloadNext();
  }

  function preloadNext() {
    var nx = session.data.screens[session.idx + 1];
    if (!nx || !nx.audio) return;
    var pre = new Audio(); pre.preload = "auto"; pre.src = "mocks/" + session.exam + "-" + session.mock + "/" + nx.audio;
    session.preload = pre;
  }

  function askFinish() {
    var left = session.data.count - answeredCount();
    confirmDialog(t("finishTitle"), t("finishText") + (left > 0 ? " " + t("finishUnanswered", { n: left }) : ""), t("finishConfirm"), t("keepGoing"), function () { finishSection(false); });
  }

  /* ------------------------------------------------------------------ finish + submit */
  var lastResult = {};

  function finishSection(timeUp) {
    if (!session || session.finished) return;
    session.finished = true;
    var s = session;
    stopSession();
    var k = key(s.exam, s.mock, s.sec);
    var overlay = h("div", { class: "wrap page" }, h("div", { class: "loading" }, h("div", { class: "spinner" }), timeUp ? t("timeUp") : t("submitting")));
    show(overlay);
    if (PREVIEW) {
      store.del("fwy.preview." + k); store.del(localKey(s.exam, s.mock, s.sec));
      lastResult[k] = { preview: true, answered: Object.keys(s.answers).length, total: s.data.count, section: s.sec };
      session = null;
      location.hash = "#/m/" + s.exam + "-" + s.mock + "/" + s.sec + "/result";
      return;
    }
    var body = { code: user.code, exam: s.exam, mock: s.mock, section: s.sec, answers: s.answers, played: s.played, texts: s.texts, recs: s.recs };
    var attempt = function () {
      api("submit", body, 60000).then(function (d) {
        store.del(localKey(s.exam, s.mock, s.sec));
        lastResult[k] = d.result;
        setAttempt(s.exam, s.mock, s.sec, attemptSummary(d.result));
        session = null;
        location.hash = "#/m/" + s.exam + "-" + s.mock + "/" + s.sec + "/result";
      }, function (e) {
        if (e.code === "network") {
          show(h("div", { class: "wrap page" }, h("div", { class: "notice warn", role: "alert", text: t("saveError") }),
            h("p", null, h("button", { class: "btn btn-primary", type: "button", text: t("tryAgain"), onclick: function () { show(overlay); attempt(); } }))));
        } else {
          errorView(t("netError") + " (" + e.code + ")", function () { show(overlay); attempt(); });
        }
      });
    };
    attempt();
  }

  function attemptSummary(r) {
    if (!r) return { status: "submitted" };
    if (r.status === "pending") return { status: "pending" };
    return { status: r.status === "marked" ? "marked" : "submitted", score: r.score, scale: r.scale, nclc: r.nclc, cefr: r.cefr };
  }

  /* ------------------------------------------------------------------ writing (EE) */
  function wordCount(text) { var m = String(text || "").trim().match(/\S+/g); return m ? m.length : 0; }

  function renderWriting() {
    var tasks = session.data.tasks;
    var cur = Math.min(session.idx || 0, tasks.length - 1);
    var task = tasks[cur];

    var list = h("div", { class: "rail-grid" }, tasks.map(function (tk) {
      return h("div", { class: "wc-row" },
        h("span", { text: t("task") + " " + tk.n }), h("b", { id: "wc-" + tk.n, text: t("words", { n: wordCount(session.texts[tk.n]) }) }));
    }));
    var rail = h("aside", { class: "rail" }, railName(), railClock(), list);

    var tabs = h("div", { class: "task-tabs", role: "tablist" }, tasks.map(function (tk, i) {
      return h("button", { type: "button", class: "task-tab", role: "tab", "aria-selected": String(i === cur), onclick: function () { session.idx = i; persist(); renderWriting(); } },
        t("task") + " " + tk.n, h("small", { text: tk.level }));
    }));
    var range = task.words || [];
    var target = range[1] ? t("wordsTarget", { a: range[0], b: range[1] }) : t("wordsMin", { a: range[0] });
    var counter = h("b", { id: "wcMain" });
    var box = h("textarea", { class: "writebox", id: "writebox", placeholder: t("writeHere"), spellcheck: "false", autocomplete: "off", autocorrect: "off", autocapitalize: "sentences", "aria-label": task.title });
    box.value = session.texts[task.n] || "";
    var updateCount = function () {
      var n = wordCount(box.value);
      counter.textContent = t("words", { n: n });
      counter.className = range[0] && n < range[0] ? "low" : range[1] && n > range[1] ? "high" : "ok";
      var side = $("#wc-" + task.n); if (side) side.textContent = t("words", { n: n });
    };
    var debounce = null;
    box.addEventListener("input", function () {
      session.texts[task.n] = box.value; updateCount();
      clearTimeout(debounce); debounce = setTimeout(persist, 400);
    });
    updateCount();

    var prompt = h("div", { class: "prompt" }, h("h2", { text: task.title }), blocks(task.prompt));
    var docs = (task.docs || []).map(function (d) { return renderDoc({ kind: "article", title: d.title, body: d.body }); });
    var last = cur === tasks.length - 1;
    var nav = h("div", { class: "navbar" },
      h("button", { class: "btn btn-ghost", type: "button", text: t("previous"), disabled: cur === 0, onclick: function () { session.idx = cur - 1; persist(); renderWriting(); } }),
      last ? h("button", { class: "btn btn-primary", type: "button", text: t("sendTexts"), onclick: function () {
        confirmDialog(t("finishTitle"), t("finishText"), t("finishConfirm"), t("keepGoing"), function () { finishSection(false); });
      } }) : h("button", { class: "btn btn-primary", type: "button", text: t("next"), onclick: function () { session.idx = cur + 1; persist(); renderWriting(); } }));

    var paper = h("section", { class: "paper" }, tabs, prompt, docs,
      h("div", null, box, h("div", { class: "counter" }, counter, h("span", { text: target }))), nav);
    show(h("div", { class: "wrap" }, h("div", { class: "test acc-ee" }, rail, paper)));
  }

  /* ------------------------------------------------------------------ speaking (EO) */
  function renderSpeaking() {
    var tasks = session.data.tasks;
    session.eo = session.eo || {};
    var cur = 0;
    while (cur < tasks.length - 1 && session.recs[tasks[cur].n]) cur++;
    if (session.idx > cur) cur = Math.min(session.idx, tasks.length - 1);
    session.idx = cur;
    var task = tasks[cur];
    var allDone = tasks.every(function (tk) { return session.recs[tk.n]; });

    var steps = h("div", { class: "task-steps" }, tasks.map(function (tk, i) {
      return h("span", { class: session.recs[tk.n] ? "ok" : i === cur ? "now" : "", text: t("task") + " " + tk.n });
    }));
    var rail = h("aside", { class: "rail" }, railName(), h("div", { class: "prog" }, h("div", { class: "lbl" }, h("span", { text: t("taskOf", { n: task.n, t: tasks.length }) })), h("div", { style: "margin-top:8px" }, steps)));

    var stage = h("div", { class: "stage", id: "stage" });
    var prompt = h("div", { class: "prompt" }, h("h2", { text: task.title }), blocks(task.prompt));
    var poster = task.poster ? h("div", { class: "poster", style: "background:" + (task.poster.color || "#2A6099") },
      h("h3", { text: task.poster.title }), h("div", { class: "subt", text: task.poster.subtitle }),
      h("ul", null, task.poster.lines.map(function (l) { return h("li", { text: l }); })), h("div", { class: "pfoot", text: task.poster.footer })) : null;

    var paper = h("section", { class: "paper" }, h("p", { class: "hint", text: t("eoIntro") }), prompt, poster, stage);
    show(h("div", { class: "wrap" }, h("div", { class: "test acc-eo" }, rail, paper)));

    if (allDone) { stageAllDone(stage); return; }
    if (session.recs[task.n]) { stageDone(stage, task); return; }
    stageIdle(stage, task);
  }

  function stageIdle(stage, task) {
    var hasPrep = task.prep > 0;
    var flash = session.justUploaded ? h("div", { class: "notice ok", role: "status", text: t("uploaded") }) : null;
    session.justUploaded = false;
    stage.replaceChildren();
    append(stage, [flash,
      h("div", { class: "btn-row" },
        hasPrep ? h("span", { class: "chip" }, h("small", { text: t("prepare") }), fmtClock(task.prep * 1000)) : null,
        h("span", { class: "chip" }, h("small", { text: t("recording") }), fmtClock(task.speak * 1000))),
      h("div", { class: "btn-row" }, h("button", { class: "btn btn-primary", type: "button", text: hasPrep ? t("startPrep") : t("startSpeaking"), onclick: function (e) {
        e.currentTarget.disabled = true;
        getMic().then(function () { if (hasPrep) runPrep(stage, task); else runRec(stage, task); }, function (err) {
          stage.append(h("div", { class: "notice err", role: "alert", text: err === "unsupported" ? t("micUnsupported") : t("micDenied") }));
          e.target.disabled = false;
        });
      } }))]);
  }

  function getMic() {
    if (session.stream && session.stream.active) return Promise.resolve(session.stream);
    if (!navigator.mediaDevices || pickMime() === null) return Promise.reject("unsupported");
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (st) { session.stream = st; return st; });
  }

  function countdown(seconds, onTick, onEnd) {
    var end = Date.now() + seconds * 1000;
    var id = setInterval(function () {
      var left = end - Date.now();
      onTick(left);
      if (left <= 0) { clearInterval(id); onEnd(); }
    }, 250);
    session.timers.push(id);
    onTick(seconds * 1000);
    return function () { clearInterval(id); };
  }

  function runPrep(stage, task) {
    var clock = h("div", { class: "big-clock" });
    stage.replaceChildren(h("div", null, h("b", { text: t("prepare") })), clock, h("p", { class: "hint", text: t("prepNote") }));
    countdown(task.prep, function (left) { clock.textContent = fmtClock(left); }, function () { runRec(stage, task); });
  }

  function runRec(stage, task) {
    var mime = pickMime();
    var chunks = [];
    var rec;
    try { rec = new MediaRecorder(session.stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined); }
    catch (e) { rec = new MediaRecorder(session.stream); }
    session.recorder = rec;
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    var clock = h("div", { class: "big-clock" });
    var cueBox = h("div", { "aria-live": "polite" });
    var stopBtn = h("button", { class: "btn btn-ghost", type: "button", text: t("stopEarly") });
    stage.replaceChildren(h("div", null, h("span", { class: "rec-dot", "aria-hidden": "true" }), h("b", { text: t("recording") })), clock, cueBox,
      h("p", { class: "hint", text: t("eoRecNote") }), h("div", { class: "btn-row" }, stopBtn));
    var shown = -1;
    var started = Date.now();
    var cancel = countdown(task.speak, function (left) {
      clock.textContent = fmtClock(left);
      var elapsed = (Date.now() - started) / 1000, idx = -1;
      (task.cues || []).forEach(function (c, i) { if (elapsed >= c.at) idx = i; });
      if (idx !== shown && idx >= 0) {
        shown = idx;
        cueBox.replaceChildren(h("div", { class: "cue" }, h("small", { text: t("examinerSays") }), task.cues[idx].text));
      }
    }, function () { stop(); });
    var stopped = false;
    function stop() {
      if (stopped) return; stopped = true; cancel();
      if (rec.state === "recording") rec.stop();
    }
    rec.onstop = function () {
      var blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
      uploadRec(stage, task, blob);
    };
    stopBtn.addEventListener("click", function () {
      confirmDialog(t("stopEarly") + " ?", null, t("finishConfirm"), t("keepGoing"), stop);
    });
    rec.start(1000);
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1] || ""); };
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  function uploadRec(stage, task, blob) {
    session.eo[task.n] = blob;
    stage.replaceChildren(h("div", { class: "loading", style: "padding:20px 0" }, h("div", { class: "spinner" }), t("uploading")));
    if (PREVIEW) {
      session.recs[task.n] = "preview"; session.justUploaded = true; persist();
      renderSpeaking(); return;
    }
    blobToBase64(blob).then(function (b64) {
      return api("upload", { code: user.code, exam: session.exam, mock: session.mock, section: session.sec, task: task.n, mime: blob.type, data: b64 }, 180000);
    }).then(function (d) {
      if (!session) return;
      session.recs[task.n] = d.url || true; session.justUploaded = true; persist(); serverSave(true);
      renderSpeaking();
    }, function () {
      var url = URL.createObjectURL(blob);
      stage.replaceChildren(h("div", { class: "notice err", role: "alert", text: t("uploadFailed") }),
        h("div", { class: "btn-row" },
          h("button", { class: "btn btn-primary", type: "button", text: t("retryUpload"), onclick: function () { uploadRec(stage, task, blob); } }),
          h("a", { class: "btn btn-ghost", href: url, download: "FWY " + session.exam.toUpperCase() + " " + session.mock + " EO " + task.n + (blob.type.indexOf("mp4") >= 0 ? ".m4a" : ".webm"), text: t("downloadRec") })));
    });
  }

  function stageDone(stage, task) {
    var tasks = session.data.tasks;
    var i = tasks.indexOf(task);
    stage.replaceChildren(h("div", { class: "notice ok", text: t("uploaded") }),
      h("div", { class: "btn-row" }, i < tasks.length - 1
        ? h("button", { class: "btn btn-primary", type: "button", text: t("nextTask"), onclick: function () { session.idx = i + 1; persist(); renderSpeaking(); } })
        : h("button", { class: "btn btn-primary", type: "button", text: t("finishSpeaking"), onclick: function () { finishSection(false); } })));
  }

  function stageAllDone(stage) {
    stage.replaceChildren(h("div", { class: "notice ok", text: t("recordingsReady") }),
      h("div", { class: "btn-row" }, h("button", { class: "btn btn-primary", type: "button", text: t("finishSpeaking"), onclick: function () { finishSection(false); } })));
  }

  /* ------------------------------------------------------------------ results */
  /* contiguous score ranges for each level of the chosen scale */
  function levelRuns(exam, sec, mode) {
    var max = LV.scale(exam, sec), runs = [];
    for (var sc = 0; sc <= max; sc++) {
      var lab = mode === "cefr" ? LV.cefr(exam, sec, sc) : (LV.nclc(exam, sec, sc) || 0);
      var last = runs[runs.length - 1];
      if (last && last.lab === lab) last.to = sc; else runs.push({ lab: lab, from: sc, to: sc });
    }
    return runs;
  }

  function resultRibbon(exam, sec, score) {
    var max = LV.scale(exam, sec);
    var runs = levelRuns(exam, sec, scaleMode);
    var bands = runs.map(function (r, i) {
      var k = Math.round(14 + i * 86 / Math.max(1, runs.length - 1));
      var label = scaleMode === "cefr" ? r.lab : r.lab ? String(r.lab) : "< 4";
      return h("div", { class: "band" + (k > 50 ? " on-dark" : ""), style: "flex:0 0 " + ((r.to - r.from + 1) / (max + 1) * 100) + "%;--k:" + k + "%",
        title: (scaleMode === "cefr" ? "" : "NCLC ") + label + " : " + r.from + "–" + r.to }, h("span", { text: label }));
    });
    var marker = h("div", { class: "marker", style: "left:0%", text: String(score) });
    var wrap = h("div", { class: "res-ribbon" }, marker, h("div", { class: "ribbon", role: "img", "aria-label": t("score") + " " + score + " / " + max }, bands));
    requestAnimationFrame(function () { requestAnimationFrame(function () { marker.style.left = Math.min(100, Math.max(0, (score + 0.5) / (max + 1) * 100)) + "%"; }); });
    return wrap;
  }

  function levelBoxes(r) {
    var nclcBox = h("div", { class: "lvl" + (scaleMode === "nclc" ? " main" : "") }, h("small", { text: "NCLC" }), h("b", { text: r.nclc ? String(r.nclc) : "< 4" }),
      h("span", { text: t("nclcFull") }));
    var cefrBox = h("div", { class: "lvl" + (scaleMode === "cefr" ? " main" : "") }, h("small", { text: t("cefrShort") }),
      h("b", { text: (r.exam === "tef" ? "≈ " : "") + r.cefr }), h("span", { text: t("cefrName_" + r.cefr) }));
    return h("div", { class: "levels" }, scaleMode === "cefr" ? [cefrBox, nclcBox] : [nclcBox, cefrBox]);
  }

  function viewResult(exam, mock, sec) {
    var k = key(exam, mock, sec);
    var head = crumbs([{ href: "#/", text: t("home") }, { href: "#/m/" + exam + "-" + mock + "/" + sec, text: examName(exam) + ", " + t("mockTitle", { n: mock }).toLowerCase() }, { text: secName(sec) }]);
    var r = lastResult[k];
    if (r) return drawResult(r);
    if (PREVIEW || !user) { location.hash = "#/m/" + exam + "-" + mock + "/" + sec; return; }
    loadingView();
    api("result", { code: user.code, exam: exam, mock: mock, section: sec }).then(function (d) {
      lastResult[k] = d.result; setAttempt(exam, mock, sec, attemptSummary(d.result)); drawResult(d.result);
    }, function (e) {
      if (e.code === "no_result") { location.hash = "#/m/" + exam + "-" + mock + "/" + sec; return; }
      errorView(t("netError"), function () { route(); });
    });

    function drawResult(res) {
      var band = h("div", { class: "sec-band res-band" }, h("span", { class: "ico", svg: ICONS[sec] }),
        h("div", { class: "exam-name", text: examName(exam) + ", " + t("mockTitle", { n: mock }).toLowerCase() }), h("h1", { text: secName(sec) }));
      var body = [head, band];
      if (res.preview) {
        body.push(h("div", { class: "panel" }, h("p", { style: "margin-top:0", text: t("previewDone") }), h("p", { class: "muted", text: t("previewAnswered", { n: res.answered, t: res.total }) }),
          h("a", { class: "btn btn-ghost", href: "#/", text: t("home") })));
        show(h("div", { class: "wrap page narrow acc-" + sec }, body)); return;
      }
      if (res.status === "pending") {
        body.push(h("div", { class: "panel" }, h("h2", { style: "margin-top:0", text: t("pendingTitle") }), h("p", { text: t("pendingText") }),
          h("div", { class: "btn-row" }, h("a", { class: "btn btn-primary", href: "#/results", text: t("myResults") }), h("a", { class: "btn btn-ghost", href: "#/", text: t("home") }))));
        show(h("div", { class: "wrap page narrow acc-" + sec }, body)); return;
      }
      res.exam = res.exam || exam;
      var scaleMax = LV.scale(exam, sec);
      var hero = h("section", { class: "score-hero" });
      var fill = function () {
        hero.replaceChildren(
          h("div", { class: "score-top" },
            h("div", null, h("div", { class: "score-label", text: res.status === "marked" ? t("teacherMark") : t("score") }),
              h("div", { class: "score-num" }, String(res.score), h("small", { text: "/ " + scaleMax })),
              res.total ? h("div", { class: "score-sub", text: t("correctAnswers", { c: res.correct, t: res.total }) }) : null),
            levelBoxes(res)),
          h("div", { class: "res-scale" }, h("h3", { text: t("whereScore") }), scaleSwitch(fill)),
          resultRibbon(exam, sec, res.score),
          h("div", { class: "res-note", text: t("estimated") }));
      };
      fill();
      body.push(hero);
      if (res.comment) body.push(h("div", { class: "panel", style: "margin-top:16px" }, h("h2", { style: "margin-top:0;font-size:18px", text: t("teacherComment") }), h("p", { style: "margin:0;white-space:pre-wrap", text: res.comment })));
      if (res.review && res.review.length) {
        var reviewBox = h("div", { class: "review" });
        body.push(h("h2", { style: "margin:32px 0 12px;font-size:24px;letter-spacing:-.02em", text: t("correction") }), reviewBox);
        loadSection(exam, mock, sec).then(function (data) {
          var qtext = {};
          data.screens.forEach(function (s) { s.questions.forEach(function (q) { qtext[q.n] = q.q || ""; }); });
          append(reviewBox, res.review.map(function (rv) { return reviewItem(rv, qtext[rv.n]); }));
        });
      }
      body.push(h("div", { class: "btn-row", style: "margin-top:20px" }, h("a", { class: "btn btn-ghost", href: "#/results", text: t("myResults") }), h("a", { class: "btn btn-ghost", href: "#/", text: t("home") })));
      show(h("div", { class: "wrap page narrow acc-" + sec }, body));
    }
  }

  function reviewItem(rv, publicQ) {
    var cls = !rv.given ? "none" : rv.ok ? "ok" : "ko";
    var opts = rv.options || [];
    var optText = function (L) {
      var o = opts.filter(function (x) { return x.indexOf(L + ". ") === 0; })[0];
      return o || L;
    };
    var item = h("div", { class: "rv " + cls },
      h("div", { class: "rv-head" }, h("b", { text: t("question") + " " + rv.n }), h("span", { class: "pill " + (cls === "ok" ? "pill-done" : cls === "ko" ? "pill-wrong" : "pill-soon"), text: cls === "ok" ? t("correct") : cls === "ko" ? t("wrong") : t("noAnswer") })),
      (rv.question || publicQ) ? h("div", { class: "rv-q", text: rv.question || publicQ }) : null,
      h("div", { class: "rv-ans" },
        h("div", { class: "mine " + cls }, t("yourAnswer") + " : ", rv.given ? optText(rv.given) : t("noAnswer")),
        rv.ok ? null : h("div", { class: "right" }, t("rightAnswer") + " : " + optText(rv.answer))),
      rv.why ? h("div", { class: "rv-why" }, h("b", { text: t("why") + " " }), rv.why) : null,
      rv.transcript ? h("details", null, h("summary", { text: t("transcript") }), h("pre", { text: rv.transcript })) : null);
    return item;
  }

  function viewResults() {
    if (!user) { askCode(function () { route(); }); show(h("div", { class: "wrap page" }, h("div", { class: "notice", text: t("needCode") }))); return; }
    if (PREVIEW) { show(h("div", { class: "wrap page" }, h("h1", { text: t("resultsTitle") }), h("div", { class: "notice warn", text: t("previewBanner") }))); return; }
    loadingView();
    api("results", { code: user.code }).then(function (d) {
      var items = d.items || [];
      items.forEach(function (it) { setAttempt(it.exam, it.mock, it.section, attemptSummary(it)); });
      var body = [h("h1", { class: "page-title", text: t("resultsTitle") })];
      if (!items.length) body.push(h("div", { class: "panel" }, h("p", { style: "margin-top:0", text: t("resultsEmpty") }), h("a", { class: "btn btn-primary", href: "#/", text: t("home") })));
      var groups = {};
      items.forEach(function (it) { var g = it.exam + "-" + it.mock; (groups[g] = groups[g] || []).push(it); });
      Object.keys(groups).sort().forEach(function (g) {
        var list = groups[g], ex = list[0].exam, mk = list[0].mock;
        var rows = SECS.map(function (s) {
          var it = list.filter(function (x) { return x.section === s; })[0];
          var status = !it ? h("span", { class: "pill pill-todo", text: t("status_todo") }) : it.status === "pending" ? h("span", { class: "pill pill-pending", text: t("status_pending") }) : h("span", { class: "pill pill-done", text: t("status_done") });
          return h("tr", null,
            h("td", null, h("a", { href: it ? "#/m/" + ex + "-" + mk + "/" + s + "/result" : "#/m/" + ex + "-" + mk + "/" + s, text: secName(s) })),
            h("td", null, status),
            h("td", { class: "num", text: it && it.score != null ? it.score + " / " + LV.scale(ex, s) : "—" }),
            h("td", { class: "num", text: it && it.score != null ? (it.nclc ? it.nclc : "<4") : "—" }),
            h("td", { class: "num", text: it && it.score != null ? (it.exam === "tef" ? "≈ " : "") + it.cefr : "—" }));
        });
        var scored = list.filter(function (x) { return x.score != null; });
        var lowest = scored.slice().sort(function (a, b) { return (a.nclc || 0) - (b.nclc || 0); })[0];
        body.push(h("div", { class: "panel" },
          h("h2", { style: "margin-top:0", text: examName(ex) + ", " + t("mockTitle", { n: mk }).toLowerCase() }),
          h("div", { style: "overflow-x:auto" }, h("table", { class: "res-table" },
            h("thead", null, h("tr", null, h("th", { text: t("colTest") }), h("th", { text: t("colStatus") }), h("th", { text: t("score") }), h("th", { text: "NCLC" }), h("th", { text: t("cefrShort") }))),
            h("tbody", null, rows))),
          scored.length === 4 ? h("p", { class: "res-sum", text: t("lowestSkill", { l: "NCLC " + (lowest.nclc || "< 4") + ", " + (lowest.exam === "tef" ? "≈ " : "") + lowest.cefr }) }) : null));
      });
      show(h("div", { class: "wrap page narrow" }, body));
    }, function () { errorView(t("netError"), function () { route(); }); });
  }

  /* ------------------------------------------------------------------ router */
  function confirmLeave() {
    if (!session || session.finished) return true;
    return window.confirm(lang === "fr" ? "Quitter l'épreuve ? Le chronomètre continue." : "Leave the test? The timer keeps running.");
  }

  var currentHash = location.hash;
  function route(keepSession) {
    var hash = location.hash.replace(/^#\/?/, "");
    var parts = hash.split("/").filter(Boolean);
    if (session && keepSession === true) {
      // language switch during a test: redraw the same screen
      if (session.sec === "co" || session.sec === "ce") renderMcq(); else if (session.sec === "ee") renderWriting(); else renderSpeaking();
      return;
    }
    if (session) { stopSession(); session = null; }
    loadCatalog().then(function () {
      if (!parts.length) return viewHome();
      if (parts[0] === "results") return viewResults();
      if (parts[0] === "m" && parts[1]) {
        var em = parts[1].split("-"), exam = em[0], mock = parseInt(em[1], 10), sec = parts[2];
        if (SECS.indexOf(sec) < 0) return viewHome();
        if (parts[3] === "test") return viewTest(exam, mock, sec);
        if (parts[3] === "result") return viewResult(exam, mock, sec);
        return viewIntro(exam, mock, sec);
      }
      viewHome();
    }, function () { errorView(t("netError"), function () { route(); }); });
  }

  window.addEventListener("hashchange", function () {
    if (session && !session.finished && location.hash !== currentHash) {
      if (!confirmLeave()) { history.replaceState(null, "", currentHash); return; }
    }
    currentHash = location.hash;
    route();
  });

  document.addEventListener("keydown", function (e) {
    if (!session || (session.sec !== "co" && session.sec !== "ce")) return;
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey || $(".dlg")) return;
    var s = session.data.screens[session.idx];
    var L = e.key.toUpperCase();
    if (["A", "B", "C", "D"].indexOf(L) >= 0 && s.questions.length === 1) {
      var btn = document.querySelector('[data-n="' + s.questions[0].n + '"][data-l="' + L + '"]');
      if (btn) btn.click();
    } else if (session.sec === "ce" && e.key === "ArrowRight") go(session.idx + 1);
    else if (session.sec === "ce" && e.key === "ArrowLeft") go(session.idx - 1);
  });

  /* ------------------------------------------------------------------ boot */
  renderChrome();
  refreshUser().then(function () { renderChrome(); route(); });
})();
