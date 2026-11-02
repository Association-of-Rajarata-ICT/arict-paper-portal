import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { paperFileName } from "@/lib/paperNaming.mjs";
import { uploadPaperToDrive } from "@/lib/server/drive";
import { toPositiveInt, validatePaperFields } from "@/lib/server/paperFields";
import { createPaperRecord, listPapers } from "@/lib/server/papersRepository";
import { getPublicPapers } from "@/lib/server/publicPapers";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department") || "";
    const yearParam = searchParams.get("year");
    const semesterParam = searchParams.get("semester");

    const filters = {};
    if (department) filters.department = department;
    if (yearParam) filters.year = toPositiveInt(yearParam);
    if (semesterParam) filters.semester = toPositiveInt(semesterParam);

    // The unfiltered list is the cached one the pages use; filters are for scripts and read Neon.
    const papers = Object.keys(filters).length ? await listPapers(filters) : await getPublicPapers();
    return NextResponse.json({ papers });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load papers." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const formData = await request.formData();
    const subjectCode = String(formData.get("subjectCode") || "").trim();
    const subjectName = String(formData.get("subjectName") || "").trim();
    const instructor = String(formData.get("instructor") || "").trim();
    const department = String(formData.get("department") || "").trim();
    const year = toPositiveInt(formData.get("year"));
    const semester = toPositiveInt(formData.get("semester"));
    const examPeriod = String(formData.get("examPeriod") || "").trim();
    const file = formData.get("file");

    const validationError = validatePaperFields({
      subjectCode,
      subjectName,
      department,
      year,
      semester,
      examPeriod,
    });
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "A PDF file is required." }, { status: 400 });
    }

    const upload = await uploadPaperToDrive({
      file,
      department,
      year,
      semester,
      fileName: paperFileName({ subjectCode, subjectName, examPeriod, year, semester }),
    });

    const paper = await createPaperRecord({
      subjectCode,
      subjectName,
      instructor,
      department,
      year,
      semester,
      examPeriod,
      ...upload,
    });

    return NextResponse.json({ paper }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to create paper." },
      { status: 500 }
    );
  }
}
