#!/usr/bin/env node
/**
 * Bulk upload past papers through the same API the admin "Add Paper" form uses.
 *
 * Step 1 — build a manifest you can review/edit in Excel:
 *   node scripts/bulk-upload-papers.mjs plan "<extracted folder>" [--department Computing]
 *
 * Step 2 — upload every row with include=yes (resumable, skips duplicates):
 *   node scripts/bulk-upload-papers.mjs upload "<extracted folder>" [--base-url http://localhost:3000] [--limit 5] [--dry-run]
 *
 * Optional — remove every existing paper of a department first (DB record + Drive file to trash):
 *   node scripts/bulk-upload-papers.mjs purge [--department Computing] [--base-url ...] [--yes]
 *
 * upload/purge sign in with ADMIN_USERNAME / ADMIN_PASSWORD from the environment or .env.local.
 *
 * Expected folder layout:  Year N/<Semester folder>/<YYYY Mon-Mon>/<CODE NNNN - TITLE>.pdf
 *   Semester folder is "Semester 1", "Semester 2", "Semester 1 & 2" or "Pre Semester".
 *
 * Output files (git-ignored) are written to ./bulk-upload/:
 *   manifest.csv     one row per PDF, edit before uploading
 *   upload-log.json  result per file, so re-running continues where it stopped
 *   logs/            one timestamped log per run
 *   results/         per-run CSV with the outcome (and failure reason) of every file
 *   backups/         JSON of the papers removed by purge
 */

import fs from "node:fs";
import path from "node:path";
import { buildRows } from "./lib/paper-names.mjs";

const OUT_DIR = path.resolve("bulk-upload");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.csv");
const LOG_PATH = path.join(OUT_DIR, "upload-log.json");
// Local time, e.g. 2026-10-15_05-19-41, so log names match the clock on the machine.
const RUN_ID = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-");
let runLogPath = "";

const COLUMNS = [
  "include",
  "subjectCode",
  "subjectName",
  "examPeriod",
  "year",
  "semester",
  "department",
  "instructor",
  "file",
  "notes",
];

// ---------- plan ----------

function plan(root, options) {
  const department = options.department || "Computing";
  const files = walkPdfs(root);
  if (!files.length) throw new Error(`No PDFs found under ${root}`);

  const rows = buildRows(files.map((full) => path.relative(root, full).split(path.sep).join("/")), department);
  writeCsv(MANIFEST_PATH, COLUMNS, rows);

  const flagged = rows.filter((row) => row.notes);
  console.log(`Wrote ${rows.length} rows to ${path.relative(process.cwd(), MANIFEST_PATH)}`);
  console.log(`${flagged.length} rows have notes worth reviewing (see the "notes" column).`);
  console.log(`Set include=no on any row you don't want uploaded, then run the upload step.`);
}

// ---------- upload ----------

const RESULT_COLUMNS = [
  "file",
  "subjectCode",
  "subjectName",
  "examPeriod",
  "year",
  "semester",
  "status",
  "reason",
  "attempts",
  "seconds",
  "paperId",
  "driveLink",
];

function normalizeKey(paper) {
  const clean = (value) => String(value ?? "").toLowerCase().replace(/\s+/g, "");
  return [paper.subjectCode, paper.examPeriod, paper.year, paper.semester, paper.department].map(clean).join("|");
}

function driveFileName(row) {
  const period = row.examPeriod.replace(/\s*\|\s*/g, "-");
  return `${row.subjectCode.replace(/\s*\/\s*/g, "_")} - ${row.subjectName} - ${period}.pdf`.replace(/[\\/:*?"<>|]/g, "");
}

async function fetchPapers(baseUrl, department) {
  const response = await fetch(`${baseUrl}/api/papers?department=${encodeURIComponent(department)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not list existing papers (${response.status}).`);
  const { papers = [] } = await response.json();
  return papers;
}

async function fetchExistingKeys(baseUrl, department) {
  const papers = await fetchPapers(baseUrl, department);
  return new Set(
    papers.map((paper) =>
      normalizeKey({
        subjectCode: paper.courseCode,
        examPeriod: paper.examPeriod,
        year: paper.yearNumber,
        semester: paper.semesterNumber,
        department: paper.departmentFull || paper.department,
      })
    )
  );
}

async function postPaper(baseUrl, cookie, row, filePath) {
  const body = new FormData();
  body.set("subjectCode", row.subjectCode);
  body.set("subjectName", row.subjectName);
  body.set("instructor", row.instructor || "");
  body.set("department", row.department);
  body.set("year", String(row.year));
  body.set("semester", String(row.semester));
  body.set("examPeriod", row.examPeriod);
  body.set("file", new File([fs.readFileSync(filePath)], driveFileName(row), { type: "application/pdf" }));

  let response;
  try {
    response = await fetch(`${baseUrl}/api/papers`, { method: "POST", body, headers: { cookie } });
  } catch (error) {
    const networkError = new Error(`network error: ${error.cause?.code || error.cause?.message || error.message}`);
    networkError.retryable = true;
    throw networkError;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}: ${payload.message || response.statusText}`);
    error.retryable = response.status >= 500 || response.status === 429;
    error.status = response.status;
    throw error;
  }
  return payload.paper;
}

async function upload(root, options) {
  const baseUrl = String(options["base-url"] || "http://localhost:3000").replace(/\/$/, "");
  const limit = options.limit ? Number(options.limit) : Infinity;
  const dryRun = Boolean(options["dry-run"]);

  if (!fs.existsSync(MANIFEST_PATH)) throw new Error("No manifest found. Run the plan step first.");
  const rows = parseCsv(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const state = fs.existsSync(LOG_PATH) ? JSON.parse(fs.readFileSync(LOG_PATH, "utf8")) : {};
  const saveState = () => fs.writeFileSync(LOG_PATH, JSON.stringify(state, null, 2));

  const results = [];
  const record = (row, fields) => results.push({ ...row, ...fields });

  const problems = [];
  const queue = [];
  for (const row of rows) {
    if (row.include.toLowerCase() !== "yes") {
      record(row, { status: "excluded", reason: "include is not yes in manifest" });
      continue;
    }
    if (state[row.file]?.status === "uploaded") {
      record(row, { status: "already-uploaded", reason: "uploaded in an earlier run", paperId: state[row.file].id, driveLink: state[row.file].driveLink });
      continue;
    }
    const missing = ["subjectCode", "subjectName", "examPeriod", "year", "semester", "department"].filter((key) => !row[key]);
    if (missing.length) problems.push(`${row.file}: missing ${missing.join(", ")}`);
    else if (!["1", "2"].includes(row.semester)) problems.push(`${row.file}: semester must be 1 or 2`);
    else if (!fs.existsSync(path.join(root, row.file))) problems.push(`${row.file}: file not found under ${root}`);
    else queue.push(row);
  }
  if (problems.length) {
    problems.forEach((problem) => log(problem, "error"));
    throw new Error(`${problems.length} manifest rows need fixing before uploading.`);
  }

  const cookie = await login(baseUrl);

  const existing = new Set();
  for (const department of new Set(queue.map((row) => row.department))) {
    for (const key of await fetchExistingKeys(baseUrl, department)) existing.add(key);
  }

  const todo = [];
  for (const row of queue) {
    if (existing.has(normalizeKey(row))) record(row, { status: "skipped", reason: "same code + exam period + year + semester already in portal" });
    else todo.push(row);
  }

  const batch = todo.slice(0, limit);
  log(`${batch.length} to upload, ${queue.length - todo.length} already in portal, ${rows.length - queue.length} excluded/done → ${baseUrl}${dryRun ? " [dry run]" : ""}`);

  let uploaded = 0;
  let failed = 0;
  for (const [index, row] of batch.entries()) {
    const label = `[${index + 1}/${batch.length}] ${row.subjectCode} · ${row.examPeriod} · Y${row.year}S${row.semester}`;
    if (dryRun) {
      log(`${label}  (would upload ${row.file} as "${driveFileName(row)}")`);
      record(row, { status: "dry-run", reason: "would upload" });
      continue;
    }

    const started = Date.now();
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const paper = await postPaper(baseUrl, cookie, row, path.join(root, row.file));
        const seconds = ((Date.now() - started) / 1000).toFixed(1);
        state[row.file] = { status: "uploaded", id: paper?.id, driveLink: paper?.driveLink, at: new Date().toISOString() };
        record(row, { status: "uploaded", attempts: attempt, seconds, paperId: paper?.id, driveLink: paper?.driveLink });
        uploaded++;
        log(`${label}  ✓ ${seconds}s`);
        break;
      } catch (error) {
        if (error.retryable && attempt < 3) {
          log(`${label}  retry ${attempt}: ${error.message}`, "warn");
          await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
          continue;
        }
        const seconds = ((Date.now() - started) / 1000).toFixed(1);
        state[row.file] = { status: "failed", error: error.message, at: new Date().toISOString() };
        record(row, { status: "failed", reason: error.message, attempts: attempt, seconds });
        failed++;
        log(`${label}  ✗ ${error.message}`, "error");
        // Every later upload would fail the same way — stop instead of burning through the list.
        if (error.status === 401) throw new Error("Admin session rejected (401). Check ADMIN_* env values and re-run.");
        break;
      }
    }
    saveState();
  }

  for (const row of todo.slice(batch.length)) record(row, { status: "pending", reason: "beyond --limit; run again" });

  const resultsPath = path.join(OUT_DIR, "results", `upload-${RUN_ID}${dryRun ? "-dry-run" : ""}.csv`);
  writeCsv(resultsPath, RESULT_COLUMNS, results);

  const byStatus = results.reduce((acc, row) => ({ ...acc, [row.status]: (acc[row.status] || 0) + 1 }), {});
  log(`summary: ${Object.entries(byStatus).map(([status, count]) => `${status}=${count}`).join(", ")}`);
  if (failed) {
    const reasons = results.filter((row) => row.status === "failed").reduce((acc, row) => acc.set(row.reason, (acc.get(row.reason) || 0) + 1), new Map());
    log("failure reasons:", "warn");
    for (const [reason, count] of reasons) log(`  ${count}× ${reason}`, "warn");
    log("Re-run the same command to retry failed rows.", "warn");
  }
  log(`results: ${path.relative(process.cwd(), resultsPath)}`);
  log(`run log: ${path.relative(process.cwd(), runLogPath)}`);
  if (!dryRun) log(`done: ${uploaded} uploaded, ${failed} failed`);
}

// ---------- purge ----------

async function purge(options) {
  const baseUrl = String(options["base-url"] || "http://localhost:3000").replace(/\/$/, "");
  const department = options.department || "Computing";
  const confirmed = Boolean(options.yes);

  const cookie = await login(baseUrl);
  const papers = await fetchPapers(baseUrl, department);
  log(`${papers.length} existing ${department} papers${confirmed ? " will be removed" : " (dry run — add --yes to remove)"}`);
  for (const paper of papers) {
    log(`  ${paper.courseCode} · ${paper.examPeriod} · ${paper.academicYear} ${paper.semester} · drive ${paper.driveFileId || "-"}`);
  }
  if (!confirmed || !papers.length) return;

  const backupPath = path.join(OUT_DIR, "backups", `purge-${department}-${RUN_ID}.json`);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(papers, null, 2));
  log(`backup of removed records: ${path.relative(process.cwd(), backupPath)}`);

  let removed = 0;
  for (const paper of papers) {
    const response = await fetch(`${baseUrl}/api/papers/${encodeURIComponent(paper.id)}`, { method: "DELETE", headers: { cookie } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      log(`  ✗ ${paper.courseCode} (${paper.id}): HTTP ${response.status} ${payload.message || ""}`, "error");
      continue;
    }
    removed++;
    if (payload.driveWarning) log(`  ! ${paper.courseCode}: record removed, Drive file not trashed — ${payload.driveWarning}`, "warn");
    else log(`  ✓ removed ${paper.courseCode} · ${paper.examPeriod} (Drive file moved to trash)`);
  }

  // Old upload state no longer matches the portal.
  if (fs.existsSync(LOG_PATH)) {
    fs.renameSync(LOG_PATH, path.join(OUT_DIR, "backups", `upload-log-${RUN_ID}.json`));
    log("upload-log.json reset (moved to backups/)");
  }
  log(`done: ${removed}/${papers.length} removed`);
}

// ---------- main ----------

const USAGE = `Usage:
  node scripts/bulk-upload-papers.mjs plan   "<extracted folder>" [--department Computing]
  node scripts/bulk-upload-papers.mjs upload "<extracted folder>" [--base-url http://localhost:3000] [--limit N] [--dry-run]
  node scripts/bulk-upload-papers.mjs purge  [--department Computing] [--base-url http://localhost:3000] [--yes]`;

const { command, folder, options } = parseArgs(process.argv.slice(2));
const needsFolder = command === "plan" || command === "upload";
if (!["plan", "upload", "purge"].includes(command) || (needsFolder && !folder)) {
  console.log(USAGE);
  process.exit(1);
}

const root = needsFolder ? path.resolve(folder) : "";
if (needsFolder && !fs.existsSync(root)) {
  console.error(`Folder not found: ${root}`);
  process.exit(1);
}

if (command !== "plan") startRunLog(command);
try {
  if (command === "plan") plan(root, options);
  else if (command === "upload") await upload(root, options);
  else await purge(options);
} catch (error) {
  log(error.message, "error");
  process.exit(1);
}
