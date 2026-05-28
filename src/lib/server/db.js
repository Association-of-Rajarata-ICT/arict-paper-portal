import { Pool } from "pg";

let pool;
let initialized = false;

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function query(text, params = []) {
  const db = getPool();
  return db.query(text, params);
}

export async function ensureSchema() {
  if (initialized) return;

  await query(`
    CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      instructor TEXT,
      department TEXT NOT NULL,
      year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
      semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
      drive_file_id TEXT NOT NULL,
      drive_link TEXT NOT NULL,
      drive_preview_link TEXT,
      drive_folder_path TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_papers_department ON papers(department);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(year);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_papers_semester ON papers(semester);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_papers_created_at ON papers(created_at DESC);
  `);

  await query(`
    ALTER TABLE papers ADD COLUMN IF NOT EXISTS exam_period TEXT;
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_papers_exam_period ON papers(exam_period);
  `);

  initialized = true;
}
