// Minimal stand-ins for the Google Apps Script services used by backend/Code.gs,
// so the real backend code can be run and tested locally with Node.
"use strict";
const fs = require("fs");
const vm = require("vm");
const crypto = require("crypto");

class Range {
  constructor(sheet, row, col, nr, nc) { Object.assign(this, { sheet, row, col, nr: nr || 1, nc: nc || 1 }); }
  setValue(v) { this.sheet._set(this.row, this.col, v); return this; }
  setValues(vals) { vals.forEach((r, i) => r.forEach((v, j) => this.sheet._set(this.row + i, this.col + j, v))); return this; }
  getValues() { const out = []; for (let i = 0; i < this.nr; i++) { const r = []; for (let j = 0; j < this.nc; j++) r.push(this.sheet._get(this.row + i, this.col + j)); out.push(r); } return out; }
  setFontWeight() { return this; } setBackground() { return this; } setFontColor() { return this; }
  setDataValidation() { return this; } setNumberFormat() { return this; } setWrap() { return this; }
}

class Sheet {
  constructor(name) { this.name = name; this.data = []; }
  getName() { return this.name; }
  _set(r, c, v) { while (this.data.length < r) this.data.push([]); const row = this.data[r - 1]; while (row.length < c) row.push(""); row[c - 1] = v; }
  _get(r, c) { const row = this.data[r - 1]; return row && row[c - 1] !== undefined ? row[c - 1] : ""; }
  getLastRow() { return this.data.length; }
  getLastColumn() { return this.data.reduce((m, r) => Math.max(m, r.length), 0); }
  getDataRange() { return new Range(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  getRange(r, c, nr, nc) { return new Range(this, r, c, nr, nc); }
  appendRow(arr) { this.data.push(arr.map((v) => (v === undefined ? "" : v))); return this; }
  setFrozenRows() { return this; } setColumnWidth() { return this; }
}

class Book {
  constructor() { this.sheets = [new Sheet("Sheet1")]; }
  getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; }
  insertSheet(n) { const s = new Sheet(n); this.sheets.push(s); return s; }
  getSheets() { return this.sheets.slice(); }
  deleteSheet(s) { this.sheets = this.sheets.filter((x) => x !== s); }
}

function makeFolder(name, store) {
  const folder = {
    id: crypto.randomUUID(), name, children: [], files: [],
    getId() { return this.id; },
    createFolder(n) { const f = makeFolder(n, store); this.children.push(f); store.folders[f.id] = f; return f; },
    getFoldersByName(n) { const list = this.children.filter((c) => c.name === n); let i = 0; return { hasNext: () => i < list.length, next: () => list[i++] }; },
    createFile(blob) {
      const id = crypto.randomUUID();
      const file = { id, name: blob.name, bytes: blob.bytes, getUrl: () => "https://drive.google.com/file/d/" + id + "/view", getId: () => id };
      this.files.push(file); store.files.push(file); return file;
    }
  };
  return folder;
}

function createContext() {
  const book = new Book();
  const props = {};
  const drive = { folders: {}, files: [], roots: [] };
  const ctx = {
    console,
    JSON, Math, Date, Object, Array, String, Number, isNaN, parseInt, Error,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => book,
      newDataValidation: () => { const b = { requireValueInList: () => b, setAllowInvalid: () => b, build: () => ({}) }; return b; },
      getUi: () => ({ createMenu: () => ({ addItem() { return this; }, addToUi() {} }), alert() {} })
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (s) => ({ content: s, setMimeType() { return this; }, getContent() { return this.content; } })
    },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      base64Decode: (s) => Array.from(Buffer.from(s, "base64")),
      newBlob: (bytes, mime, name) => ({ bytes, mime, name })
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] || null, setProperty: (k, v) => { props[k] = v; } }) },
    DriveApp: {
      getFolderById: (id) => { if (!drive.folders[id]) throw new Error("no folder"); return drive.folders[id]; },
      getFoldersByName: (n) => { const list = drive.roots.filter((f) => f.name === n); let i = 0; return { hasNext: () => i < list.length, next: () => list[i++] }; },
      createFolder: (n) => { const f = makeFolder(n, drive); drive.roots.push(f); drive.folders[f.id] = f; return f; }
    }
  };
  vm.createContext(ctx);
  const code = fs.readFileSync(require("path").join(__dirname, "..", "..", "backend", "Code.gs"), "utf8");
  vm.runInContext(code, ctx, { filename: "Code.gs" });
  ctx._book = book; ctx._drive = drive;
  return ctx;
}

function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function importKeys(ctx, csvPath) {
  const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
  const sh = ctx._book.getSheetByName("Keys");
  sh.data = rows.map((r) => r.map((v, i) => (i === 1 || i === 3 || i === 5 ? (v === "" || isNaN(Number(v)) ? v : Number(v)) : v)));
}

module.exports = { createContext, importKeys, parseCSV };
