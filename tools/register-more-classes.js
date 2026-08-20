#!/usr/bin/env node
/* Register the 3 added classes (Physics I — Calculus Based, Physics I — Algebra
 * Based, Precalculus) in data/index.json + data/classes.json (idempotent).
 * Joinable by code, like the existing catalog entries.
 * Run: node tools/register-more-classes.js  (after the seed scripts) */
"use strict";
const fs = require("fs"), path = require("path");
const DATA = path.resolve(__dirname, "..", "data");
const p41 = require("./seed-phys1441.js").LESSONS;
const p33 = require("./seed-phys1433.js").LESSONS;
const pc = require("./seed-precalc.js").LESSONS;

// ---- data/index.json ----
const idxPath = path.join(DATA, "index.json");
const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
const have = new Set(idx.lessons.map(l => l.id));
function addIndex(list) { for (const L of list) if (!have.has(L.id)) { idx.lessons.push({ id: L.id, title: L.title, file: "lessons/" + L.id + ".json" }); have.add(L.id); } }
addIndex(p41); addIndex(p33); addIndex(pc);
fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2) + "\n");

// ---- data/classes.json ----
const clsPath = path.join(DATA, "classes.json");
const cat = JSON.parse(fs.readFileSync(clsPath, "utf8"));
const lessonRows = (list) => list.map(L => ({ id: L.id, chapter: L.chapter, problems: L.problems }));
function upsertClass(entry) {
  const i = cat.classes.findIndex(c => c.code === entry.code);
  if (i >= 0) cat.classes[i] = entry; else cat.classes.push(entry);
}
upsertClass({ code: "PHYS1441", name: "Physics I — Calculus Based", institution: "NYC College of Technology (CUNY)", semester: "Fall", year: "2025",
  textbooks: ["University Physics Volume 1 — OpenStax"], lessons: lessonRows(p41) });
upsertClass({ code: "PHYS1433", name: "Physics I — Algebra Based", institution: "NYC College of Technology (CUNY)", semester: "Fall", year: "2025",
  textbooks: ["College Physics — OpenStax"], lessons: lessonRows(p33) });
upsertClass({ code: "MAT1375", name: "Precalculus", institution: "NYC College of Technology (CUNY)", semester: "Spring", year: "2026",
  textbooks: ["Precalculus — Tradler & Carley (City Tech)", "Precalculus — OpenStax"], lessons: lessonRows(pc) });
fs.writeFileSync(clsPath, JSON.stringify(cat, null, 2) + "\n");

console.log("index.json lessons:", idx.lessons.length);
console.log("classes:", cat.classes.map(c => c.code + " (" + c.lessons.length + " lessons)").join(", "));
