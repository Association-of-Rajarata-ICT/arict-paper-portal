import { DEPARTMENT_NAMES } from "@/lib/constants";

export const extractDriveId = (url = "") => {
  if (!url) return "";
  const directMatch = url.match(/\/d\/([^/]+)/);
  if (directMatch) return directMatch[1];
  const paramMatch = url.match(/[?&]id=([^&]+)/);
  if (paramMatch) return paramMatch[1];
  return "";
};

export const getPreviewUrl = (url = "") => {
  const id = extractDriveId(url);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  if (url && url.toLowerCase().endsWith(".pdf")) return url;
  return "";
};

export const getDownloadUrl = (url = "") => {
  const id = extractDriveId(url);
  if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  return url || "";
};

export const getInstructorValue = (data = {}) => {
  const value =
    data.instructor ??
    data.Instructor ??
    data["instructor name"] ??
    data["Instructor Name"] ??
    data.lecturer ??
    data.Lecturer ??
    data["lecturer name"] ??
    data["Lecturer Name"] ??
    data.instructor_name ??
    data.lecturer_name ??
    "";

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  const matchingKey = Object.keys(data).find((key) => {
    const normalized = key.trim().toLowerCase();
    return (
      normalized === "instructor" ||
      normalized === "instructor name" ||
      normalized === "lecturer" ||
      normalized === "lecturer name"
    );
  });

  if (matchingKey) {
    const fallbackValue = data[matchingKey];
    return typeof fallbackValue === "string" ? fallbackValue.trim() : "";
  }

  return "";
};

export const getExamPeriodValue = (data = {}) => {
  const value =
    data.examPeriod ??
    data.exam_period ??
    data["exam period"] ??
    data["examination period"] ??
    data["Exam period"] ??
    data["Examination period"] ??
    "";

  return typeof value === "string" ? value.trim() : "";
};

export function getPaperRouteId(paper = {}) {
  if (paper.docId) return paper.docId;
  const raw = String(paper.id || "");
  const uuidMatch = raw.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
  return uuidMatch ? uuidMatch[0] : raw;
}

export const normalizePaper = (docId, data, departmentName = "") => {
  const canonicalId = data.id || docId;
  const subjectCode = data.subjectCode || data.courseCode || data["subject code"] || "";
  const subjectName = data.subjectName || data.title || data["subject name"] || "";
  const driveLink = data.driveLink || data["drive link"] || "";
  const examPeriod = getExamPeriodValue(data);
  const academicYear =
    data.academicYear ||
    (data.yearNumber ? `Year ${data.yearNumber}` : "") ||
    (typeof data.year === "string" && data.year.startsWith("Year ") ? data.year : "");
  const department = departmentName || data.department || data.departmentFull || "";

  return {
    id: department ? `${department}-${canonicalId}` : canonicalId,
    docId: canonicalId,
    courseCode: subjectCode,
    title: subjectName,
    description: data.description || "",
    examPeriod,
    academicYear,
    year: examPeriod || academicYear,
    department,
    departmentFull: department,
    semester: data.semester || (data.semesterNumber ? `Semester ${data.semesterNumber}` : ""),
    duration: data.duration || "",
    fileSize: data.fileSize || "",
    difficulty: data.difficulty || "",
    type: data.type || null,
    isRestricted: Boolean(data.isRestricted),
    instructor: getInstructorValue(data),
    driveLink,
    yearNumber: data.yearNumber || null,
    semesterNumber: data.semesterNumber || null,
    createdAt: data.createdAt || null,
  };
};

export const paperToForm = (paper) => ({
  subjectCode: paper.courseCode || "",
  subjectName: paper.title || "",
  instructor: paper.instructor || "",
  year: String(paper.yearNumber || ""),
  semester: String(paper.semesterNumber || ""),
  examPeriod: paper.examPeriod || "",
  department: paper.departmentFull || paper.department || "",
  driveLink: paper.driveLink || "",
});

export async function fetchAllPapers() {
  const response = await fetch("/api/papers", { cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Failed to fetch papers.");
  }

  const payload = await response.json();
  return (payload.papers || []).map((paper) => normalizePaper(paper.id, paper));
}

export async function fetchPaperById(_department, docId) {
  const response = await fetch(`/api/papers/${encodeURIComponent(docId)}`, {
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Failed to fetch paper.");
  }

  const payload = await response.json();
  const paper = payload.paper;
  return normalizePaper(paper.id, paper, paper.department);
}

export async function createPaper(form, file) {
  const body = new FormData();
  body.set("subjectCode", form.subjectCode.trim());
  body.set("subjectName", form.subjectName.trim());
  body.set("instructor", form.instructor.trim());
  body.set("department", form.department);
  body.set("year", form.year);
  body.set("semester", form.semester);
  body.set("examPeriod", form.examPeriod.trim());
  if (file) {
    body.set("file", file);
  }

  const response = await fetch("/api/papers", {
    method: "POST",
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Failed to create paper.");
  }

  return payload.paper?.id;
}

export async function updatePaper(_department, docId, form, _previousDepartment, file) {
  const body = new FormData();
  body.set("subjectCode", form.subjectCode.trim());
  body.set("subjectName", form.subjectName.trim());
  body.set("instructor", form.instructor.trim());
  body.set("department", form.department);
  body.set("year", form.year);
  body.set("semester", form.semester);
  body.set("examPeriod", form.examPeriod.trim());
  if (file) {
    body.set("file", file);
  }

  const response = await fetch(`/api/papers/${encodeURIComponent(docId)}`, {
    method: "PUT",
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Failed to update paper.");
  }
}

export async function deletePaper(_department, docId) {
  const response = await fetch(`/api/papers/${encodeURIComponent(docId)}`, {
    method: "DELETE",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Failed to delete paper.");
  }
}

export function sortPapersByDate(papers, direction = "desc") {
  return [...papers].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return direction === "desc" ? bTime - aTime : aTime - bTime;
  });
}

export function getDepartmentStats(papers) {
  return DEPARTMENT_NAMES.map((name) => {
    const deptPapers = papers.filter(
      (paper) => (paper.departmentFull || paper.department) === name
    );
    const uniqueSubjects = new Set(
      deptPapers.map((paper) => paper.courseCode).filter(Boolean)
    );

    return {
      name,
      paperCount: deptPapers.length,
      courseCount: uniqueSubjects.size,
    };
  });
}

export function applyDepartmentStats(departments, papers) {
  const stats = getDepartmentStats(papers);
  const statsMap = Object.fromEntries(stats.map((item) => [item.name, item]));

  return departments.map((dept) => ({
    ...dept,
    paperCount: statsMap[dept.name]?.paperCount ?? 0,
    courseCount: statsMap[dept.name]?.courseCount ?? 0,
  }));
}

export function filterAdminPapers(papers, { query = "", department = "" } = {}) {
  let results = [...papers];

  if (department) {
    results = results.filter(
      (paper) => (paper.departmentFull || paper.department) === department
    );
  }

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    results = results.filter(
      (paper) =>
        paper.courseCode.toLowerCase().includes(q) ||
        paper.title.toLowerCase().includes(q) ||
        (paper.instructor || "").toLowerCase().includes(q) ||
        (paper.examPeriod || "").toLowerCase().includes(q) ||
        (paper.academicYear || "").toLowerCase().includes(q) ||
        (paper.year || "").toLowerCase().includes(q) ||
        (paper.departmentFull || paper.department || "").toLowerCase().includes(q)
    );
  }

  return results;
}
