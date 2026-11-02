#!/usr/bin/env node
/**
 * Rename every portal paper's Drive file to "CODE_YearN_SemesterN_Period.pdf" so downloads of
 * the same course from different sittings no longer share a file name. Safe to re-run: files
 * that already have the right name are skipped.
 *
 *   node scripts/rename-drive-papers.mjs [--dry-run]
 *
 * Needs DATABASE_URL and GOOGLE_OAUTH_* in the environment or .env.local.
 */

import fs from "node:fs";
import { google } from "googleapis";
import pg from "pg";
import { paperFileName } from "../src/lib/paperNaming.mjs";

function loadEnvFile(file = ".env.local") {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const dryRun = process.argv.includes("--dry-run");
loadEnvFile();
for (const key of ["DATABASE_URL", "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"]) {
  if (!process.env[key]) {
    console.error(`${key} is not set.`);
    process.exit(1);
  }
}

const auth = new google.auth.OAuth2(process.env.GOOGLE_OAUTH_CLIENT_ID, process.env.GOOGLE_OAUTH_CLIENT_SECRET);
auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth });

// Current names of every PDF the account can see, in one paged listing instead of a call per file.
const currentNames = new Map();
let pageToken;
do {
  const { data } = await drive.files.list({
    q: "mimeType = 'application/pdf' and trashed = false",
    fields: "nextPageToken, files(id, name)",
    pageSize: 1000,
    pageToken,
  });
  for (const file of data.files) currentNames.set(file.id, file.name);
  pageToken = data.nextPageToken;
} while (pageToken);

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const { rows } = await db.query(`SELECT subject_code, subject_name, exam_period, year, semester, drive_file_id FROM papers`);
await db.end();

const stats = { renamed: 0, alreadyNamed: 0, missing: 0, failed: 0 };
for (const row of rows) {
  const current = currentNames.get(row.drive_file_id);
  if (current === undefined) {
    stats.missing++;
    continue;
  }
  const name = paperFileName({
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    examPeriod: row.exam_period,
    year: row.year,
    semester: row.semester,
  });
  if (current === name) {
    stats.alreadyNamed++;
    continue;
  }
  if (dryRun) {
    stats.renamed++;
    if (stats.renamed <= 10) console.log(`would rename "${current}" -> "${name}"`);
    continue;
  }
  try {
    await drive.files.update({ fileId: row.drive_file_id, requestBody: { name } });
    stats.renamed++;
    if (stats.renamed % 100 === 0) console.log(`  ${stats.renamed} renamed ...`);
  } catch (error) {
    stats.failed++;
    console.error(`fail ${row.drive_file_id} (${row.subject_code}): ${error.message}`);
  }
}

console.log(
  `${dryRun ? "[dry run] " : ""}done: ${stats.renamed} ${dryRun ? "to rename" : "renamed"}, ` +
    `${stats.alreadyNamed} already named, ${stats.missing} not found in Drive, ${stats.failed} failed`
);
