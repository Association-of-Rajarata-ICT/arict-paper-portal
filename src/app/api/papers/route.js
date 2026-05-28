import { NextResponse } from "next/server";
import { DEPARTMENT_NAMES } from "@/lib/constants";
import { uploadPaperToDrive } from "@/lib/server/drive";
import { createPaperRecord, listPapers } from "@/lib/server/papersRepository";

function toPositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function validatePayload({ subjectCode, subjectName, department, year, semester }) {
  if (!subjectCode || !subjectName || !department || !year || !semester) {
    return "Subject code, subject name, department, year, and semester are required.";
  }

  if (!DEPARTMENT_NAMES.includes(department)) {
    return "Invalid department.";
  }

  if (!Number.isInteger(year) || year < 1 || year > 4) {
    return "Year must be between 1 and 4.";
  }

  if (![1, 2].includes(semester)) {
    return "Semester must be 1 or 2.";
  }

  return "";
}

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

    const papers = await listPapers(filters);
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
    const formData = await request.formData();
    const subjectCode = String(formData.get("subjectCode") || "").trim();
    const subjectName = String(formData.get("subjectName") || "").trim();
    const instructor = String(formData.get("instructor") || "").trim();
    const department = String(formData.get("department") || "").trim();
    const year = toPositiveInt(formData.get("year"));
    const semester = toPositiveInt(formData.get("semester"));
    const file = formData.get("file");

    const validationError = validatePayload({
      subjectCode,
      subjectName,
      department,
      year,
      semester,
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
    });

    const paper = await createPaperRecord({
      subjectCode,
      subjectName,
      instructor,
      department,
      year,
      semester,
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
