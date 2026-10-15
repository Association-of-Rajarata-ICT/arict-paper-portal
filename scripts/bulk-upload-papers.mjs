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

const MONTHS = {
  jan: "January",
  feb: "February",
  mar: "March",
  apr: "April",
  may: "May",
  jun: "June",
  jul: "July",
  aug: "August",
  sep: "September",
  oct: "October",
  nov: "November",
  dec: "December",
};

// Known prefixes and the OCR-style mistakes found in file names.
const KNOWN_PREFIXES = new Set(["ICT", "COM", "FDN", "IDC", "CMP", "BIO"]);
const PREFIX_FIXES = { LCT: "ICT", TCT: "ICT" };
const RAW_NAME_FIXES = [[/^CT1 402\b/, "ICT 1402"]];
const TITLE_FIXES = [
  [/\bSCIENCS\b/g, "SCIENCES"],
  [/\bSCIENCES,/g, "SCIENCES"],
  [/(?<=[A-Z])0(?=[A-Z])/g, "O"], // "PR0GRAM"
];

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "for", "in", "of", "on", "or", "the", "to", "with"]);
const ACRONYMS = new Set(["ICT", "IT", "GIS", "HCI", "OS", "SQL", "UML", "AI", "IOT", "II", "III", "IV", "ERP", "MIS"]);

// ---------- helpers ----------

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positional = [];
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      i++;
    }
  }
  return { command, folder: positional[0], options };
}

function walkPdfs(root) {
  const results = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.toLowerCase().endsWith(".pdf")) results.push(full);
    }
  }
  return results.sort();
}

function writeCsv(file, columns, rows) {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.join(","), ...rows.map((row) => columns.map((col) => escape(row[col])).join(","))];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // BOM so Excel opens it as UTF-8.
  fs.writeFileSync(file, "\uFEFF" + lines.join("\r\n") + "\r\n");
}

function startRunLog(command) {
  fs.mkdirSync(path.join(OUT_DIR, "logs"), { recursive: true });
  runLogPath = path.join(OUT_DIR, "logs", `${command}-${RUN_ID}.log`);
  log(`run started: node scripts/bulk-upload-papers.mjs ${process.argv.slice(2).join(" ")}`);
}

// Prints to the console and appends a timestamped line to this run's log file.
function log(message, level = "info") {
  const print = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  print(message);
  if (runLogPath) {
    fs.appendFileSync(runLogPath, `${new Date().toISOString()} [${level.toUpperCase()}] ${message}\n`);
  }
}

function loadEnvFile(file = ".env.local") {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

async function login(baseUrl) {
  loadEnvFile();
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD (in .env.local) so the script can sign in.");
  }

  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).catch((error) => {
    throw new Error(`Cannot reach ${baseUrl} (${error.cause?.code || error.message}). Is "npm run dev" running?`);
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Admin login failed: ${payload.message || `HTTP ${response.status}`}`);

  log(`signed in to ${baseUrl} as ${username}`);
  return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  text = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((value) => value !== "")) rows.push(row);
  }

  const [header, ...body] = rows;
  // Excel may save with ";" in some locales — fail loudly instead of guessing.
  if (!header || !header.includes("subjectCode")) {
    throw new Error("manifest.csv header not recognised. Save it as comma-separated CSV (UTF-8).");
  }
  return body.map((values) => Object.fromEntries(header.map((key, idx) => [key.trim(), (values[idx] ?? "").trim()])));
}

function titleCase(text) {
  return text
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((word, index) => {
      if (!word.trim() || word === "-") return word;
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      if (index > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

function normalizeCode(prefix, digits, notes) {
  let fixedPrefix = prefix.toUpperCase();
  if (PREFIX_FIXES[fixedPrefix]) {
    fixedPrefix = PREFIX_FIXES[fixedPrefix];
    notes.add(`code prefix corrected from "${prefix}"`);
  }
  if (!KNOWN_PREFIXES.has(fixedPrefix)) notes.add(`unknown code prefix "${prefix}"`);

  const fixedDigits = digits.replace(/[Il]/g, "1").replace(/[Oo]/g, "0");
  if (fixedDigits !== digits) notes.add(`code digits corrected from "${digits}"`);

  return `${fixedPrefix}${fixedDigits}`;
}

function parseFileName(fileName, notes) {
  let stem = fileName.replace(/\.pdf$/i, "").trim();

  const copyMatch = stem.match(/\s*\((\d+)\)$/);
  if (copyMatch) {
    stem = stem.slice(0, copyMatch.index);
    notes.add(`copy (${copyMatch[1]}) — second paper for this subject`);
  }

  for (const [pattern, replacement] of RAW_NAME_FIXES) {
    if (pattern.test(stem)) {
      notes.add(`code corrected from "${stem.match(pattern)[0]}"`);
      stem = stem.replace(pattern, replacement);
    }
  }

  const match = stem.match(/^((?:[A-Za-z]{2,4}\s*[0-9OoIl]{4}\s*_?\s*)+)-?\s*(.+)$/);
  if (!match) {
    notes.add("could not read code/title from file name — fill in manually");
    return { subjectCode: "", subjectName: titleCase(stem) };
  }

  const codes = [...match[1].matchAll(/([A-Za-z]{2,4})\s*([0-9OoIl]{4})/g)].map(([, prefix, digits]) =>
    normalizeCode(prefix, digits, notes)
  );
  if (codes.length > 1) notes.add("shared paper with multiple codes");

  let title = match[2].trim();
  for (const [pattern, replacement] of TITLE_FIXES) title = title.replace(pattern, replacement);
  // "NON - SCIENCE" / "E - COMMERCE" are hyphenated words, not separators.
  title = title.replace(/\b(NON|E)\s+-\s+/gi, "$1-");

  return { subjectCode: codes.join(" / "), subjectName: titleCase(title) };
}

// "2026 Mar-May" -> ["March | May 2026"], "2016 May-Jun & Nov-Dec" -> ["May | June 2016", "November | December 2016"]
function parseSession(folderName) {
  const match = folderName.match(/^(\d{4})\s+(.+)$/);
  if (!match) return null;
  const [, year, rangesText] = match;
  return rangesText.split("&").map((range) => {
    const months = range
      .trim()
      .split("-")
      .map((part) => MONTHS[part.trim().slice(0, 3).toLowerCase()]);
    if (months.some((month) => !month)) return "";
    return `${months.join(" | ")} ${year}`;
  });
}

// ---------- plan ----------

function plan(root, options) {
  const department = options.department || "Computing";
  const files = walkPdfs(root);
  if (!files.length) throw new Error(`No PDFs found under ${root}`);

  const rows = files.map((full) => {
    const relative = path.relative(root, full).split(path.sep).join("/");
    const parts = relative.split("/");
    const notes = new Set();

    if (parts.length !== 4) notes.add("unexpected folder depth — check year/semester/period");
    const [yearFolder = "", semesterFolder = "", sessionFolder = "", fileName = ""] =
      parts.length === 4 ? parts : ["", "", "", parts.at(-1)];

    const year = Number.parseInt((yearFolder.match(/Year\s*(\d)/i) || [])[1], 10) || "";
    const semesterMatch = semesterFolder.match(/^Semester\s*([12])$/i);
    const { subjectCode, subjectName } = parseFileName(fileName, notes);

    return {
      include: "yes",
      subjectCode,
      subjectName,
      examPeriod: "",
      year,
      semester: semesterMatch ? Number(semesterMatch[1]) : "",
      department,
      instructor: "",
      file: relative,
      notes,
      semesterFolder,
      sessions: parseSession(sessionFolder) || [],
    };
  });

  // Learn which semester each subject usually belongs to from the plain "Semester 1/2" folders,
  // then use that for "Semester 1 & 2" and "Pre Semester" folders.
  const semesterCounts = new Map();
  for (const row of rows) {
    if (!row.semester || !row.subjectCode) continue;
    const key = row.subjectCode.split(" / ")[0];
    const counts = semesterCounts.get(key) || { 1: 0, 2: 0 };
    counts[row.semester]++;
    semesterCounts.set(key, counts);
  }

  for (const row of rows) {
    if (!row.semester) {
      const counts = semesterCounts.get(row.subjectCode.split(" / ")[0]) || { 1: 0, 2: 0 };
      if (counts[1] !== counts[2]) {
        row.semester = counts[1] > counts[2] ? 1 : 2;
        row.notes.add(
          `semester ${row.semester} inferred from "${row.semesterFolder}" folder (other sessions: S1×${counts[1]}, S2×${counts[2]})`
        );
      } else {
        row.semester = 1;
        row.notes.add(
          `CHECK semester — "${row.semesterFolder}" folder, other sessions don't decide (S1×${counts[1]}, S2×${counts[2]}); defaulted to 1`
        );
      }
    }

    if (row.sessions.length === 1) {
      row.examPeriod = row.sessions[0];
    } else if (row.sessions.length > 1) {
      // Combined folder: first range is semester 1, second is semester 2.
      row.examPeriod = row.sessions[row.semester - 1] || row.sessions[0];
      row.notes.add("exam period picked from combined-semester folder");
    }
    if (!row.examPeriod) row.notes.add("CHECK exam period — could not read session folder");

    const codeYear = Number(row.subjectCode.match(/\d/)?.[0]);
    if (codeYear && row.year && codeYear !== row.year) {
      row.notes.add(`code is a year-${codeYear} subject but folder is Year ${row.year}`);
    }
  }

  const seen = new Map();
  for (const row of rows) {
    const key = `${row.subjectCode}|${row.examPeriod}`;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  for (const row of rows) {
    if (seen.get(`${row.subjectCode}|${row.examPeriod}`) > 1) {
      row.notes.add("same subject + exam period appears more than once — check before uploading");
    }
    row.notes = [...row.notes].join("; ");
  }

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
