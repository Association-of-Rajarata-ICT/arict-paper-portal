import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { streamDriveFile } from "@/lib/server/drive";
import { getSubmission } from "@/lib/server/submissionsRepository";

// Lets an admin read a pending (private) upload without signing in to the Drive account.
export async function GET(request, { params }) {
  try {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const submission = await getSubmission(id);
    if (!submission?.driveFileId) {
      return NextResponse.json({ message: "Submission not found." }, { status: 404 });
    }

    return new Response(await streamDriveFile(submission.driveFileId), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="submission-${id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Could not open the file." },
      { status: 500 }
    );
  }
}
