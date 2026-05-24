import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
    data.year ??
    data.Year ??
    data["exam period"] ??
    data["examination period"] ??
    data["Exam period"] ??
    data["Examination period"] ??
    "";

  return typeof value === "string" ? value.trim() : "";
};

export const normalizePaper = (docId, data, departmentName = "") => {
  const subjectCode =
    data["subject code"] || data.subjectCode || data.courseCode || "";
  const subjectName =
    data["subject name"] || data.subjectName || data.title || "";
  const driveLink = data["drive link"] || data.driveLink || "";
  const year = getExamPeriodValue(data);
  const department = departmentName || data.department || data.departmentFull || "";

  return {
    id: department ? `${department}-${docId}` : docId,
    docId,
    courseCode: subjectCode,
    title: subjectName,
    description: data.description || "",
    year,
    department,
    departmentFull: department,
    semester: data.semester || "",
    duration: data.duration || "",
    fileSize: data.fileSize || "",
    difficulty: data.difficulty || "",
    type: data.type || null,
    isRestricted: Boolean(data.isRestricted),
    instructor: getInstructorValue(data),
    driveLink,
    createdAt: data.createdAt ?? null,
  };
};

export const formToPayload = (form, { includeTimestamp = false } = {}) => {
  const payload = {
    "subject code": form.subjectCode.trim(),
    "subject name": form.subjectName.trim(),
    instructor: form.instructor.trim(),
    year: form.year.trim(),
    "drive link": form.driveLink.trim(),
    department: form.department,
  };

  if (includeTimestamp) {
    payload.createdAt = serverTimestamp();
  }

  return payload;
};

export const paperToForm = (paper) => ({
  subjectCode: paper.courseCode || "",
  subjectName: paper.title || "",
  instructor: paper.instructor || "",
  year: paper.year || "",
  department: paper.departmentFull || paper.department || "",
  driveLink: paper.driveLink || "",
});

export async function fetchAllPapers() {
  const snapshots = await Promise.all(
    DEPARTMENT_NAMES.map((dept) => getDocs(collection(db, dept)))
  );

  return snapshots.flatMap((snapshot, index) => {
    const collectionName = DEPARTMENT_NAMES[index];
    return snapshot.docs.map((docSnap) =>
      normalizePaper(docSnap.id, docSnap.data(), collectionName)
    );
  });
}

export async function fetchPaperById(department, docId) {
  const snap = await getDoc(doc(db, department, docId));
  if (!snap.exists()) return null;
  return normalizePaper(snap.id, snap.data(), department);
}

export async function createPaper(form) {
  const payload = formToPayload(form, { includeTimestamp: true });
  const ref = await addDoc(collection(db, form.department), payload);
  return ref.id;
}

export async function updatePaper(department, docId, form, previousDepartment) {
  const payload = formToPayload(form);

  if (previousDepartment && form.department !== previousDepartment) {
    await addDoc(collection(db, form.department), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    await deleteDoc(doc(db, previousDepartment, docId));
    return;
  }

  await updateDoc(doc(db, department, docId), payload);
}

export async function deletePaper(department, docId) {
  await deleteDoc(doc(db, department, docId));
}

export function sortPapersByDate(papers, direction = "desc") {
  return [...papers].sort((a, b) => {
    const aTime = a.createdAt?.seconds ?? 0;
    const bTime = b.createdAt?.seconds ?? 0;
    return direction === "desc" ? bTime - aTime : aTime - bTime;
  });
}

export function getDepartmentStats(papers) {
  return DEPARTMENT_NAMES.map((name) => ({
    name,
    count: papers.filter(
      (paper) => (paper.departmentFull || paper.department) === name
    ).length,
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
        (paper.year || "").toLowerCase().includes(q) ||
        (paper.departmentFull || paper.department || "").toLowerCase().includes(q)
    );
  }

  return results;
}
