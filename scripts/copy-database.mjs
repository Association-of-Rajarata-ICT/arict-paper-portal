#!/usr/bin/env node
/**
 * Copy every portal table from one Neon database to another (e.g. when moving to a new account).
 * The source is only read, never changed. Safe to re-run: rows already in the target are skipped.
 *
 *   NEW_DATABASE_URL="postgresql://..." node scripts/copy-database.mjs
 *
 * The source is DATABASE_URL (environment or .env.local). The target gets the same tables
 * the app creates for itself, then the rows.
 */

import fs from "node:fs";
import pg from "pg";

function loadEnvFile(file = ".env.local") {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

loadEnvFile();
const sourceUrl = process.env.DATABASE_URL;
const targetUrl = process.env.NEW_DATABASE_URL;
if (!sourceUrl || !targetUrl) {
  console.error("Set DATABASE_URL (source, e.g. in .env.local) and NEW_DATABASE_URL (target).");
  process.exit(1);
}
if (sourceUrl === targetUrl) {
  console.error("Source and target are the same database.");
  process.exit(1);
}

// Create the tables exactly as the app does, in the target.
process.env.DATABASE_URL = targetUrl;
const { ensureSchema } = await import("../src/lib/server/db.js");
await ensureSchema();

const connect = (url) => new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
const source = connect(sourceUrl);
const target = connect(targetUrl);

const TABLES = [
  { name: "papers", key: "id" },
  { name: "portal_settings", key: "key" },
  { name: "paper_submissions", key: "id" },
];
const BATCH = 200;

try {
  for (const { name, key } of TABLES) {
    const { rows } = await source.query(`SELECT * FROM ${name}`);
    if (!rows.length) {
      console.log(`${name}: empty, nothing to copy`);
      continue;
    }
    const columns = Object.keys(rows[0]);
    let copied = 0;
    for (let start = 0; start < rows.length; start += BATCH) {
      const batch = rows.slice(start, start + BATCH);
      const values = [];
      const tuples = batch.map((row) => {
        const placeholders = columns.map((column) => {
          values.push(row[column]);
          return `$${values.length}`;
        });
        return `(${placeholders.join(",")})`;
      });
      const result = await target.query(
        `INSERT INTO ${name} (${columns.join(",")}) VALUES ${tuples.join(",")} ON CONFLICT (${key}) DO NOTHING`,
        values
      );
      copied += result.rowCount;
    }
    const { rows: counted } = await target.query(`SELECT COUNT(*)::int AS count FROM ${name}`);
    console.log(`${name}: ${rows.length} in source, ${copied} copied now, ${counted[0].count} in target`);
  }
} finally {
  await source.end();
  await target.end();
}
