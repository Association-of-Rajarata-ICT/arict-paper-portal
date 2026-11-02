import { NextResponse } from "next/server";
import { DEPARTMENT_NAMES } from "@/lib/constants";
import { requireAdmin } from "@/lib/server/adminAuth";
import { paperFileName } from "@/lib/paperNaming.mjs";
import { renameDriveFile, trashDriveFile, uploadPaperToDrive } from "@/lib/server/drive";
import {
  getPaperById,
  removePaperRecord,
  updatePaperRecord,
} from "@/lib/server/papersRepository";

function toPositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeValue(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length ? trimmed : undefined;
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const paper = await getPaperById(id);
    if (!paper) {
      return NextResponse.json({ message: "Paper not found." }, { status: 404 });
    }
    return NextResponse.json({ paper });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load paper." },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const existing = await getPaperById(id);
    if (!existing) {
      return NextResponse.json({ message: "Paper not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const subjectCode = normalizeValue(formData.get("subjectCode"));
    const subjectName = normalizeValue(formData.get("subjectName"));
    const instructor = normalizeValue(formData.get("instructor")) ?? "";
    const department = normalizeValue(formData.get("department"));
    const yearRaw = formData.get("year");
    const semesterRaw = formData.get("semester");
    const examPeriod = normalizeValue(formData.get("examPeriod"));
    const file = formData.get("file");

    const year = yearRaw ? toPositiveInt(yearRaw) : undefined;
    const semester = semesterRaw ? toPositiveInt(semesterRaw) : undefined;

    if (department && !DEPARTMENT_NAMES.includes(department)) {
      return NextResponse.json({ message: "Invalid department." }, { status: 400 });
    }

    if (year !== undefined && (!Number.isInteger(year) || year < 1 || year > 4)) {
      return NextResponse.json({ message: "Year must be between 1 and 4." }, { status: 400 });
    }

    if (semester !== undefined && ![1, 2].includes(semester)) {
      return NextResponse.json({ message: "Semester must be 1 or 2." }, { status: 400 });
    }

    const targetYear = year ?? existing.yearNumber;
    const targetSemester = semester ?? existing.semesterNumber;
    const fileName = paperFileName({
      subjectCode: subjectCode ?? existing.courseCode,
      subjectName: subjectName ?? existing.title,
      examPeriod: examPeriod ?? existing.examPeriod,
      year: targetYear,
      semester: targetSemester,
    });

    let uploadPayload = {};
    let driveWarning = "";
    if (file && typeof file !== "string") {
      uploadPayload = await uploadPaperToDrive({
        file,
        department: department || existing.department,
        year: targetYear,
        semester: targetSemester,
        fileName,
      });
    } else if (existing.driveFileId) {
      // Keep the download name in step with the edited details.
      try {
        await renameDriveFile(existing.driveFileId, fileName);
      } catch (error) {
        driveWarning = error?.message || "Could not rename the Drive file.";
      }
    }

    const paper = await updatePaperRecord(id, {
      subjectCode,
      subjectName,
      instructor,
      department,
      year,
      semester,
      examPeriod,
      ...uploadPayload,
    });

    return NextResponse.json({ paper, ...(driveWarning ? { driveWarning } : {}) });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update paper." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { id } = await params;
    const existing = await getPaperById(id);
    if (!existing) {
      return NextResponse.json({ message: "Paper not found." }, { status: 404 });
    }

    // Trash (not permanently delete) the PDF so it can be restored from Drive if needed.
    let driveWarning = "";
    if (existing.driveFileId) {
      try {
        await trashDriveFile(existing.driveFileId);
      } catch (error) {
        driveWarning = error?.message || "Could not move the Drive file to trash.";
      }
    }

    await removePaperRecord(id);
    return NextResponse.json({ success: true, ...(driveWarning ? { driveWarning } : {}) });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to delete paper." },
      { status: 500 }
    );
  }
}
