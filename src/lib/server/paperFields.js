import { DEPARTMENT_NAMES } from "@/lib/constants";

export function toPositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : NaN;
}

// Returns an error message, or "" when the paper details are complete and valid.
export function validatePaperFields({ subjectCode, subjectName, department, year, semester, examPeriod }) {
  if (!subjectCode || !subjectName || !department || !year || !semester || !examPeriod) {
    return "Subject code, subject name, department, academic year, semester, and examination period are required.";
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
