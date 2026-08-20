#!/usr/bin/env node
/* Register the 3 math classes in data/index.json + data/classes.json (idempotent),
 * and rename the PHYS catalog entry to "Physics II — Calculus Based".
 * Run: node tools/register-math-classes.js  (after the seed scripts) */
"use strict";
const fs = require("fs"), path = require("path");
const DATA = path.resolve(__dirname, "..", "data");
const c1 = require("./seed-calc1.js").LESSONS;
const c2 = require("./seed-calc2.js").LESSONS;
const al = require("./seed-algebra.js").LESSONS;

// ---- data/index.json ----
const idxPath = path.join(DATA, "index.json");
const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
const have = new Set(idx.lessons.map(l => l.id));
function addIndex(list) { for (const L of list) if (!have.has(L.id)) { idx.lessons.push({ id: L.id, title: L.title, file: "lessons/" + L.id + ".json" }); have.add(L.id); } }
addIndex(c1); addIndex(c2); addIndex(al);
fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2) + "\n");

// ---- data/classes.json ----
const clsPath = path.join(DATA, "classes.json");
const cat = JSON.parse(fs.readFileSync(clsPath, "utf8"));
// rename PHYS
const phys = cat.classes.find(c => c.code === "PHYS1442");
if (phys) phys.name = "Physics II — Calculus Based";

const lessonRows = (list) => list.map(L => ({ id: L.id, chapter: L.chapter, problems: L.problems }));
function upsertClass(entry) {
  const i = cat.classes.findIndex(c => c.code === entry.code);
  if (i >= 0) cat.classes[i] = entry; else cat.classes.push(entry);
}
upsertClass({ code: "MAT1475", name: "Calculus I", institution: "NYC College of Technology (CUNY)", semester: "Spring", year: "2026",
  textbooks: ["Calculus, Volume 1 — OpenStax"], lessons: lessonRows(c1) });
upsertClass({ code: "MAT1575", name: "Calculus II", institution: "NYC College of Technology (CUNY)", semester: "Fall", year: "2025",
  textbooks: ["Calculus, Volume 1 — OpenStax", "Calculus, Volume 2 — OpenStax"], lessons: lessonRows(c2) });
upsertClass({ code: "MAT1275", name: "College Algebra", institution: "NYC College of Technology (CUNY)", semester: "Spring", year: "2026",
  textbooks: ["College Algebra & Trigonometry — Carley & Masuda", "Intermediate Algebra 2e — OpenStax"], lessons: lessonRows(al) });
fs.writeFileSync(clsPath, JSON.stringify(cat, null, 2) + "\n");

console.log("index.json lessons:", idx.lessons.length);
console.log("classes:", cat.classes.map(c => c.code + " (" + c.lessons.length + " lessons)").join(", "));
