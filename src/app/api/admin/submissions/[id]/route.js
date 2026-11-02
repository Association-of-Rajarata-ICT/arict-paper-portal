import { NextResponse } from "next/server";
import { paperFileName } from "@/lib/paperNaming.mjs";
import { requireAdmin } from "@/lib/server/adminAuth";
import { publishSubmittedFile, trashDriveFile } from "@/lib/server/drive";
import { toPositiveInt, validatePaperFields } from "@/lib/server/paperFields";
import { createPaperRecord } from "@/lib/server/papersRepository";
import { getSubmission, markSubmissionReviewed } from "@/lib/server/submissionsRepository";

// Approve (publish to the portal, with any corrections the admin made) or reject a submission.
export async function POST(request, { params }) {
  try {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const submission = await getSubmission(id);
    if (!submission) {
      return NextResponse.json({ message: "Submission not found." }, { status: 404 });
    }
    if (submission.status !== "pending") {
      return NextResponse.json(
        { message: `This submission was already ${submission.status}.` },
        { status: 409 }
      );
    }

    const { action, fields = {} } = (await request.json().catch(() => null)) || {};

    if (action === "reject") {
      let driveWarning = "";
      if (submission.driveFileId) {
        await trashDriveFile(submission.driveFileId).catch((error) => {
          driveWarning = error?.message || "Could not move the Drive file to trash.";
        });
      }
      await markSubmissionReviewed(id, { status: "rejected" });
      return NextResponse.json({ success: true, ...(driveWarning ? { driveWarning } : {}) });
    }

    if (action !== "approve") {
      return NextResponse.json({ message: "Action must be approve or reject." }, { status: 400 });
    }

    const paperFields = {
      subjectCode: String(fields.subjectCode ?? submission.subjectCode).trim(),
      subjectName: String(fields.subjectName ?? submission.subjectName).trim(),
      department: String(fields.department ?? submission.department).trim(),
      year: toPositiveInt(fields.year ?? submission.year),
      semester: toPositiveInt(fields.semester ?? submission.semester),
      examPeriod: String(fields.examPeriod ?? submission.examPeriod).trim(),
    };
    const validationError = validatePaperFields(paperFields);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const links = await publishSubmittedFile({
      fileId: submission.driveFileId,
      department: paperFields.department,
      year: paperFields.year,
      semester: paperFields.semester,
      name: paperFileName(paperFields),
    });
    const paper = await createPaperRecord({ ...paperFields, instructor: "", ...links });
    await markSubmissionReviewed(id, { status: "approved", paperId: paper.id, fields: paperFields });

    return NextResponse.json({ paper });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to review submission." },
      { status: 500 }
    );
  }
}
