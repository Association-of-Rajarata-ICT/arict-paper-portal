import { NextResponse } from "next/server";
import { SUBMISSION_MAX_BYTES } from "@/lib/submissionLimits";
import {
  getDriveFileInfo,
  getSubmissionsFolderId,
  readDriveFileStart,
  trashDriveFile,
} from "@/lib/server/drive";
import { getSubmissionUploadToken, markSubmissionUploaded } from "@/lib/server/submissionsRepository";

const badRequest = (message, status = 400) => NextResponse.json({ message }, { status });

// Step 2 of a student upload: the browser reports the Drive file it uploaded. Check it landed in
// the pending folder and really is a PDF, then queue it for review.
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { token, fileId } = (await request.json().catch(() => null)) || {};
    const submission = await getSubmissionUploadToken(id);
    if (!submission || submission.status !== "uploading" || !token || token !== submission.uploadToken) {
      return badRequest("This upload has expired. Please submit the paper again.", 404);
    }

    const info = fileId ? await getDriveFileInfo(String(fileId)) : null;
    const folderId = await getSubmissionsFolderId();
    if (!info || info.trashed || !(info.parents || []).includes(folderId)) {
      return badRequest("The uploaded file could not be found. Please try again.");
    }

    const header = await readDriveFileStart(info.id);
    if (Number(info.size) > SUBMISSION_MAX_BYTES || header.toString("latin1") !== "%PDF-") {
      await trashDriveFile(info.id).catch(() => {});
      return badRequest("That file is not a PDF. Please upload the paper as a PDF.");
    }

    await markSubmissionUploaded(id, info.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not complete a paper submission:", error);
    return badRequest("The upload could not be finished. Please try again later.", 500);
  }
}
