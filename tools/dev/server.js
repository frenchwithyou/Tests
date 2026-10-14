// Local test server: serves the site and runs backend/Code.gs with fake Google services.
// Usage: node tools/dev/server.js <site-root> <keys.csv> [port]
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { createContext, importKeys } = require("./gas-fake");

const root = path.resolve(process.argv[2] || ".");
const keys = process.argv[3];
const port = Number(process.argv[4] || 8765);
const gas = createContext();
gas.setup();
if (keys) importKeys(gas, keys);
const st = gas._book.getSheetByName("Students");
// fixed test codes for automated checks
st.appendRow(["TESTTCF", "Test TCF", "TCF", "No", "Yes", ""]);
st.appendRow(["TESTTEF", "Test TEF", "TEF", "No", "Yes", ""]);
st.appendRow(["TESTOFF", "Inactive", "TCF+TEF", "No", "No", ""]);
st.appendRow(["TESTBOTH", "Both", "TCF+TEF", "No", "Yes", ""]);

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".mp3": "audio/mpeg", ".jpg": "image/jpeg" };

http.createServer((req, res) => {
  if (req.method === "POST" && req.url.startsWith("/api")) {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const out = gas.doPost({ postData: { contents: body } });
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(out.getContent());
    });
    return;
  }
  if (req.url.startsWith("/__dump")) {
    const dump = {};
    gas._book.getSheets().forEach((s) => (dump[s.name] = s.data));
    dump._files = gas._drive.files.map((f) => ({ name: f.name, size: f.bytes.length }));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(dump, null, 1));
    return;
  }
  if (req.url.startsWith("/__set")) { // /__set?row=..&col=..&sheet=..&value=..
    const u = new URL(req.url, "http://x");
    gas._book.getSheetByName(u.searchParams.get("sheet")).getRange(Number(u.searchParams.get("row")), Number(u.searchParams.get("col"))).setValue(u.searchParams.get("value"));
    res.end("ok");
    return;
  }
  if (req.url.startsWith("/__shift")) { // move every attempt deadline into the past
    const sh = gas._book.getSheetByName("Attempts");
    sh.data.slice(1).forEach((r) => { r[7] = new Date(Date.now() - 10 * 60000); });
    res.end("ok");
    return;
  }
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("not found"); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log("dev server on http://localhost:" + port));
