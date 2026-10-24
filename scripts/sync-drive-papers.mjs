#!/usr/bin/env node
/**
 * Index PDFs that were dropped straight into Google Drive so they appear on the portal.
 * The site lists papers from the database, so a file only shows once it has a row there.
 *
 *   node scripts/sync-drive-papers.mjs "Physical Sciences" [--dry-run]
 *
 * Expected Drive layout under GOOGLE_DRIVE_ROOT_FOLDER_ID:
 *   <Department>/Year N/<Semester folder>/<YYYY Mon-Mon>/<CODE NNNN - TITLE>.pdf
 * Safe to re-run (also while a Drive upload is still in progress): files already in the portal are skipped.
 * Needs DATABASE_URL, GOOGLE_DRIVE_ROOT_FOLDER_ID and GOOGLE_OAUTH_* in the environment or .env.local.
 */

import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { google } from "googleapis";
import pg from "pg";
import { buildRows } from "./lib/paper-names.mjs";

const FOLDER_MIME = "application/vnd.google-apps.folder";

function loadEnvFile(file = ".env.local") {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const department = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!department || department.startsWith("--")) {
  console.log('Usage: node scripts/sync-drive-papers.mjs "<Department folder name>" [--dry-run]');
  process.exit(1);
}

loadEnvFile();
for (const key of ["DATABASE_URL", "GOOGLE_DRIVE_ROOT_FOLDER_ID", "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"]) {
  if (!process.env[key]) {
    console.error(`${key} is not set.`);
    process.exit(1);
  }
}

const auth = new google.auth.OAuth2(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth });

async function listChildren(parentId) {
  const files = [];
  let pageToken;
  do {
    const { data } = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: 1000,
      pageToken,
    });
    files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return files;
}

async function crawl(folderId, prefix, out) {
  for (const entry of await listChildren(folderId)) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.mimeType === FOLDER_MIME) await crawl(entry.id, relative, out);
    else if (entry.name.toLowerCase().endsWith(".pdf")) out.push({ relative, id: entry.id });
  }
}

const normalizeKey = (p) =>
  [p.code, p.period, p.year, p.semester, p.department].map((v) => String(v ?? "").toLowerCase().replace(/\s+/g, "")).join("|");

const root = (await listChildren(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID)).find(
  (f) => f.mimeType === FOLDER_MIME && f.name.trim().toLowerCase() === department.trim().toLowerCase()
);
if (!root) {
  console.error(`No "${department}" folder under the Drive root.`);
  process.exit(1);
}

console.log(`Scanning Drive folder "${root.name}" ...`);
const found = [];
await crawl(root.id, "", found);
console.log(`${found.length} PDFs found.`);

const idByPath = new Map(found.map((f) => [f.relative, f.id]));
const deptName = department.trim();
const rows = buildRows(found.map((f) => f.relative), deptName);

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const { rows: existing } = await db.query(`SELECT subject_code, exam_period, year, semester, department, drive_file_id FROM papers WHERE department = $1`, [deptName]);
const knownFileIds = new Set(existing.map((r) => r.drive_file_id));
const knownKeys = new Set(existing.map((r) => normalizeKey({ code: r.subject_code, period: r.exam_period, year: r.year, semester: r.semester, department: r.department })));

const stats = { added: 0, alreadyThere: 0, skipped: 0, failed: 0 };
for (const row of rows) {
  const fileId = idByPath.get(row.file);
  const missing = ["subjectCode", "subjectName", "examPeriod", "year", "semester"].filter((k) => !row[k]);
  if (missing.length) {
    stats.skipped++;
    console.warn(`skip ${row.file}: could not read ${missing.join(", ")}`);
    continue;
  }
  const key = normalizeKey({ code: row.subjectCode, period: row.examPeriod, year: row.year, semester: row.semester, department: row.department });
  if (knownFileIds.has(fileId) || knownKeys.has(key)) {
    stats.alreadyThere++;
    continue;
  }
  if (dryRun) {
    stats.added++;
    console.log(`would add ${row.subjectCode} · ${row.examPeriod} · Y${row.year}S${row.semester} — ${row.subjectName}`);
    continue;
  }
  try {
    // Anyone-with-link so the portal's preview/download works for visitors.
    await drive.permissions.create({ fileId, requestBody: { type: "anyone", role: "reader" } });
    await db.query(
      `INSERT INTO papers (id, subject_code, subject_name, instructor, department, year, semester, exam_period,
                           drive_file_id, drive_link, drive_preview_link, drive_folder_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        randomUUID(), row.subjectCode, row.subjectName, "", row.department, Number(row.year), Number(row.semester), row.examPeriod,
        fileId, `https://drive.google.com/file/d/${fileId}/view`, `https://drive.google.com/file/d/${fileId}/preview`,
        [row.department, `Year ${row.year}`, `Semester ${row.semester}`].join(" / "),
      ]
    );
    knownFileIds.add(fileId);
    knownKeys.add(key);
    stats.added++;
    if (stats.added % 25 === 0) console.log(`  ${stats.added} added ...`);
  } catch (error) {
    stats.failed++;
    console.error(`fail ${row.file}: ${error.message}`);
  }
}

await db.end();
console.log(`${dryRun ? "[dry run] " : ""}done: ${stats.added} ${dryRun ? "to add" : "added"}, ${stats.alreadyThere} already in portal, ${stats.skipped} skipped, ${stats.failed} failed`);
