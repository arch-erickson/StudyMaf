/* DGE — subject library router.
 *
 * Each subject has its OWN curated library under assets/<subject>/. A diagram
 * declares its subject and may ONLY use assets from that subject's registry, so a
 * physics diagram can never pull in a calculus asset or a generic filler icon.
 *
 * assets/<subject>/registry.json  -> { subject, assets: { id: {…metadata} } }
 * assets/<subject>/primitives/*.svg
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ASSETS_DIR = path.resolve(__dirname, "..", "..", "assets");

function knownSubjects() {
  if (!fs.existsSync(ASSETS_DIR)) return [];
  return fs.readdirSync(ASSETS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(ASSETS_DIR, d.name, "registry.json")))
    .map(d => d.name);
}

class SubjectLibrary {
  constructor(subject) {
    this.subject = subject;
    this.dir = path.join(ASSETS_DIR, subject);
    const reg = path.join(this.dir, "registry.json");
    if (!fs.existsSync(reg)) {
      throw new Error(`unknown subject "${subject}". Known subjects: ${knownSubjects().join(", ") || "(none — run tools/build-subject-libraries.js)"}`);
    }
    this.registry = JSON.parse(fs.readFileSync(reg, "utf8"));
    this.assets = this.registry.assets || {};
    this._raw = {};
  }
  has(id) { return Object.prototype.hasOwnProperty.call(this.assets, id); }
  get(id) { return this.assets[id] || null; }
  ids() { return Object.keys(this.assets); }

  // exact id, else a scoped search WITHIN this subject only (never global) so a
  // fuzzy query still can't reach another subject or a filler icon.
  resolve(query, opts) {
    opts = opts || {};
    if (opts.id && this.has(opts.id)) return this.get(opts.id);
    const q = String(query || "").toLowerCase().trim();
    if (this.has(q)) return this.get(q);
    const words = q.split(/[^a-z0-9]+/).filter(Boolean);
    let best = null, bestScore = 0;
    for (const id of this.ids()) {
      const a = this.assets[id];
      const hay = (id + " " + (a.roles || []).join(" ") + " " + a.topic).toLowerCase();
      let s = 0;
      for (const w of words) { if (id === w) s += 100; else if (id.includes(w)) s += 20; else if ((a.roles || []).includes(w)) s += 12; else if (hay.includes(w)) s += 4; }
      if (opts.topic && a.topic === opts.topic) s += 5;
      if (opts.role && (a.roles || []).includes(opts.role)) s += 8;
      if (s > bestScore) { bestScore = s; best = a; }
    }
    return best;
  }
  raw(id) {
    if (this._raw[id]) return this._raw[id];
    const a = this.get(id);
    if (!a) throw new Error(`asset "${id}" is not in the ${this.subject} library`);
    return (this._raw[id] = fs.readFileSync(path.join(this.dir, a.file), "utf8"));
  }
}

const _cache = {};
function loadSubject(name) {
  if (!name) throw new Error("a DGE spec must declare a subject (e.g. subject: \"physics\")");
  return _cache[name] || (_cache[name] = new SubjectLibrary(name));
}

module.exports = { loadSubject, knownSubjects, SubjectLibrary, ASSETS_DIR };
