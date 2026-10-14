/* Score → level tables. The same tables are used in backend/Code.gs.
   NCLC tables: IRCC language test equivalency charts (TEF Canada: tests taken after 10 Dec 2023). */
(function (root) {
  var NCLC = {
    // lower bound of NCLC 4, 5, 6, 7, 8, 9, 10
    tcf: { co: [331, 369, 398, 458, 503, 523, 549], ce: [342, 375, 406, 453, 499, 524, 549],
           ee: [4, 6, 7, 10, 12, 14, 16], eo: [4, 6, 7, 10, 12, 14, 16] },
    tef: { co: [306, 352, 393, 434, 462, 503, 546], ce: [306, 352, 393, 434, 462, 503, 546],
           ee: [268, 330, 379, 428, 472, 512, 558], eo: [328, 387, 422, 456, 494, 518, 556] }
  };

  function nclc(exam, section, score) {
    var t = NCLC[exam][section], lvl = 0;
    for (var i = 0; i < t.length; i++) if (score >= t[i]) lvl = 4 + i;
    return lvl; // 0 means below NCLC 4
  }

  function cefr(exam, section, score) {
    if (exam === "tcf" && (section === "co" || section === "ce")) {
      if (score < 100) return "A1";
      return ["A1", "A2", "B1", "B2", "C1", "C2"][Math.min(5, Math.floor(score / 100) - 1)];
    }
    if (exam === "tcf") { // mark out of 20
      if (score >= 16) return "C2"; if (score >= 14) return "C1"; if (score >= 10) return "B2";
      if (score >= 6) return "B1"; if (score >= 4) return "A2"; return "A1";
    }
    var n = nclc(exam, section, score); // TEF: approximate CEFR from NCLC
    if (n >= 9) return "C1"; if (n >= 7) return "B2"; if (n >= 5) return "B1"; if (n === 4) return "A2";
    return "A1";
  }

  function scale(exam, section) {
    return exam === "tcf" && (section === "ee" || section === "eo") ? 20 : 699;
  }

  root.FWY_LEVELS = { NCLC: NCLC, nclc: nclc, cefr: cefr, scale: scale };
})(typeof window !== "undefined" ? window : this);
