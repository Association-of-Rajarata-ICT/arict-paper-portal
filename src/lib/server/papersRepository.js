import { randomUUID } from "crypto";
import { ensureSchema, query } from "@/lib/server/db";

function rowToPaper(row) {
  return {
    id: row.id,
    docId: row.id,
    courseCode: row.subject_code,
    title: row.subject_name,
    instructor: row.instructor || "",
    department: row.department,
    departmentFull: row.department,
    academicYear: `Year ${row.year}`,
    examPeriod: row.exam_period || "",
    semester: `Semester ${row.semester}`,
    yearNumber: row.year,
    semesterNumber: row.semester,
    driveLink: row.drive_link,
    drivePreviewLink: row.drive_preview_link || "",
    driveFileId: row.drive_file_id,
    driveFolderPath: row.drive_folder_path,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

export async function listPapers(filters = {}) {
  await ensureSchema();

  const conditions = [];
  const values = [];

  if (filters.department) {
    values.push(filters.department);
    conditions.push(`department = $${values.length}`);
  }

  if (filters.year) {
    values.push(filters.year);
    conditions.push(`year = $${values.length}`);
  }

  if (filters.semester) {
    values.push(filters.semester);
    conditions.push(`semester = $${values.length}`);
  }

  let sql = `SELECT * FROM papers`;
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += ` ORDER BY created_at DESC`;

  const result = await query(sql, values);
  return result.rows.map(rowToPaper);
}

export async function getPaperById(id) {
  await ensureSchema();
  const result = await query(`SELECT * FROM papers WHERE id = $1 LIMIT 1`, [id]);
  if (!result.rows.length) return null;
  return rowToPaper(result.rows[0]);
}

export async function createPaperRecord(payload) {
  await ensureSchema();
  const id = randomUUID();
  await query(
    `
      INSERT INTO papers (
        id, subject_code, subject_name, instructor, department, year, semester,
        exam_period, drive_file_id, drive_link, drive_preview_link, drive_folder_path
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `,
    [
      id,
      payload.subjectCode,
      payload.subjectName,
      payload.instructor,
      payload.department,
      payload.year,
      payload.semester,
      payload.examPeriod || "",
      payload.driveFileId,
      payload.driveLink,
      payload.drivePreviewLink,
      payload.driveFolderPath,
    ]
  );

  return getPaperById(id);
}

export async function updatePaperRecord(id, payload) {
  await ensureSchema();
  const existing = await getPaperById(id);
  if (!existing) return null;

  const subjectCode = payload.subjectCode ?? existing.courseCode;
  const subjectName = payload.subjectName ?? existing.title;
  const instructor = payload.instructor ?? existing.instructor;
  const department = payload.department ?? existing.departmentFull;
  const year = payload.year ?? existing.yearNumber;
  const semester = payload.semester ?? existing.semesterNumber;
  const examPeriod = payload.examPeriod ?? existing.examPeriod ?? "";
  const driveFileId = payload.driveFileId ?? existing.driveFileId;
  const driveLink = payload.driveLink ?? existing.driveLink;
  const drivePreviewLink = payload.drivePreviewLink ?? existing.drivePreviewLink;
  const driveFolderPath = payload.driveFolderPath ?? existing.driveFolderPath;

  await query(
    `
      UPDATE papers
      SET
        subject_code = $2,
        subject_name = $3,
        instructor = $4,
        department = $5,
        year = $6,
        semester = $7,
        exam_period = $8,
        drive_file_id = $9,
        drive_link = $10,
        drive_preview_link = $11,
        drive_folder_path = $12,
        updated_at = NOW()
      WHERE id = $1
    `,
    [
      id,
      subjectCode,
      subjectName,
      instructor,
      department,
      year,
      semester,
      examPeriod,
      driveFileId,
      driveLink,
      drivePreviewLink,
      driveFolderPath,
    ]
  );

  return getPaperById(id);
}

export async function removePaperRecord(id) {
  await ensureSchema();
  await query(`DELETE FROM papers WHERE id = $1`, [id]);
}
