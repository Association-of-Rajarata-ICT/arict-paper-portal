import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { paperFileName } from "@/lib/paperNaming.mjs";
import { SUBMISSION_MAX_BYTES, SUBMISSION_MAX_MB } from "@/lib/submissionLimits";
import { createResumableUpload, getSubmissionsFolderId } from "@/lib/server/drive";
import { toPositiveInt, validatePaperFields } from "@/lib/server/paperFields";
import { countRecentSubmissions, createSubmission } from "@/lib/server/submissionsRepository";

const DAILY_LIMIT_PER_CLIENT = 15;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value, max) => String(value ?? "").trim().slice(0, max);
const badRequest = (message, status = 400) => NextResponse.json({ message }, { status });

// Step 1 of a student upload: save the details and hand back a Drive upload URL. The browser
// sends the PDF straight to Drive, then calls /api/submissions/<id>/complete.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return badRequest("Send the paper details as JSON.");

    // Hidden "website" field: people never fill it in, form-filling bots usually do.
    if (text(body.website, 200)) return badRequest("Submission rejected.");

    const origin = request.headers.get("origin") || "";
    if (!origin || new URL(origin).host !== new URL(request.url).host) {
      return badRequest("Uploads must come from the portal itself.", 403);
    }

    const fields = {
      subjectCode: text(body.subjectCode, 60).toUpperCase(),
      subjectName: text(body.subjectName, 200),
      department: text(body.department, 100),
      year: toPositiveInt(body.year),
      semester: toPositiveInt(body.semester),
      examPeriod: text(body.examPeriod, 100),
    };
    const fieldError = validatePaperFields(fields);
    if (fieldError) return badRequest(fieldError);

    const submitterName = text(body.submitterName, 120);
    const submitterEmail = text(body.submitterEmail, 200);
    if (!submitterName || !EMAIL_PATTERN.test(submitterEmail)) {
      return badRequest("Enter your name and a valid email address so ARICT can contact you.");
    }

    const fileSize = toPositiveInt(body.fileSize);
    const fileName = text(body.fileName, 200);
    if (!/\.pdf$/i.test(fileName) || !(fileSize > 0)) return badRequest("Choose a PDF file.");
    if (fileSize > SUBMISSION_MAX_BYTES) {
      return badRequest(`The PDF must be ${SUBMISSION_MAX_MB} MB or smaller.`);
    }

    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const clientHash = createHash("sha256")
      .update(`${forwardedFor.split(",")[0].trim()}|${process.env.ADMIN_SESSION_SECRET || ""}`)
      .digest("hex");
    if ((await countRecentSubmissions(clientHash)) >= DAILY_LIMIT_PER_CLIENT) {
      return badRequest("You have sent a lot of papers today. Thank you! Please try again tomorrow.", 429);
    }

    const folderId = await getSubmissionsFolderId();
    const { id, uploadToken } = await createSubmission({
      ...fields,
      submitterName,
      submitterEmail,
      notes: text(body.notes, 1000),
      fileName,
      fileSize,
      clientHash,
    });
    const uploadUrl = await createResumableUpload({
      name: `PENDING ${paperFileName(fields)}`,
      size: fileSize,
      folderId,
      origin,
    });

    return NextResponse.json({ id, token: uploadToken, uploadUrl }, { status: 201 });
  } catch (error) {
    console.error("Could not start a paper submission:", error);
    return badRequest("The upload could not be started. Please try again later.", 500);
  }
}
