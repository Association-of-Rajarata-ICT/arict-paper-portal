import { randomUUID } from "crypto";
import { ensureSchema, query } from "@/lib/server/db";

function rowToSubmission(row) {
  return {
    id: row.id,
    status: row.status,
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    department: row.department,
    year: row.year,
    semester: row.semester,
    examPeriod: row.exam_period,
    submitterName: row.submitter_name,
    submitterEmail: row.submitter_email,
    notes: row.notes || "",
    fileName: row.file_name || "",
    fileSize: row.file_size ? Number(row.file_size) : null,
    driveFileId: row.drive_file_id || "",
    paperId: row.paper_id || "",
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

// Internal: includes the upload token, which never leaves the server except to the uploader.
async function getSubmissionRow(id) {
  await ensureSchema();
  const result = await query(`SELECT * FROM paper_submissions WHERE id = $1 LIMIT 1`, [id]);
  return result.rows[0] || null;
}

export async function getSubmission(id) {
  const row = await getSubmissionRow(id);
  return row ? rowToSubmission(row) : null;
}

export async function getSubmissionUploadToken(id) {
  const row = await getSubmissionRow(id);
  return row ? { status: row.status, uploadToken: row.upload_token } : null;
}

export async function countRecentSubmissions(clientHash, hours = 24) {
  await ensureSchema();
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM paper_submissions
     WHERE client_hash = $1 AND created_at > NOW() - make_interval(hours => $2)`,
    [clientHash, hours]
  );
  return result.rows[0].count;
}

export async function countPendingSubmissions() {
  await ensureSchema();
  const result = await query(`SELECT COUNT(*)::int AS count FROM paper_submissions WHERE status = 'pending'`);
  return result.rows[0].count;
}

export async function createSubmission(payload) {
  await ensureSchema();
  const id = randomUUID();
  const uploadToken = randomUUID();
  await query(
    `INSERT INTO paper_submissions (
       id, subject_code, subject_name, department, year, semester, exam_period,
       submitter_name, submitter_email, notes, file_name, file_size, upload_token, client_hash
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      id,
      payload.subjectCode,
      payload.subjectName,
      payload.department,
      payload.year,
      payload.semester,
      payload.examPeriod,
      payload.submitterName,
      payload.submitterEmail,
      payload.notes || "",
      payload.fileName || "",
      payload.fileSize || null,
      uploadToken,
      payload.clientHash || "",
    ]
  );
  return { id, uploadToken };
}

export async function markSubmissionUploaded(id, driveFileId) {
  await ensureSchema();
  await query(
    `UPDATE paper_submissions SET status = 'pending', drive_file_id = $2, upload_token = NULL WHERE id = $1`,
    [id, driveFileId]
  );
}

export async function listSubmissions(status = "pending") {
  await ensureSchema();
  // Uploads abandoned mid-way never reached Drive; forget them after a day.
  await query(
    `DELETE FROM paper_submissions WHERE status = 'uploading' AND created_at < NOW() - INTERVAL '1 day'`
  );
  const result = await query(
    `SELECT * FROM paper_submissions WHERE status = $1 ORDER BY created_at DESC LIMIT 200`,
    [status]
  );
  return result.rows.map(rowToSubmission);
}

export async function markSubmissionReviewed(id, { status, paperId = null, fields = {} }) {
  await ensureSchema();
  await query(
    `UPDATE paper_submissions
     SET status = $2, paper_id = $3, reviewed_at = NOW(),
         subject_code = COALESCE($4, subject_code), subject_name = COALESCE($5, subject_name),
         department = COALESCE($6, department), year = COALESCE($7, year),
         semester = COALESCE($8, semester), exam_period = COALESCE($9, exam_period)
     WHERE id = $1`,
    [
      id,
      status,
      paperId,
      fields.subjectCode ?? null,
      fields.subjectName ?? null,
      fields.department ?? null,
      fields.year ?? null,
      fields.semester ?? null,
      fields.examPeriod ?? null,
    ]
  );
}
