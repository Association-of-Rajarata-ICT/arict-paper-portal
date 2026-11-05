import { COURSES, DEPARTMENT_COURSES, OLD_CODES } from "@/data/curriculum";
import { compactText } from "@/lib/paperNaming.mjs";
import { mergeSharedPapers, sortPapers } from "@/lib/papers";

const COURSE_BY_CODE = new Map(COURSES.map((course) => [course.code, course]));

// "MAT 1204" -> "MAT1204"; anything that is not a course code -> "".
export function normalizeCourseCode(value = "") {
  const code = String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-Z]{3,4}\d{4}$/.test(code) ? code : "";
}

// "BOT 1203 / BIO 1203" -> ["BOT1203", "BIO1203"]; "HPT 1214/1201" -> ["HPT1214", "HPT1201"].
export function paperCourseCodes(courseCode = "") {
  const codes = [];
  let prefix = "";
  for (const part of String(courseCode).split(/[/&,]|\s+or\s+/i)) {
    const compact = part.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const code = normalizeCourseCode(/^\d{4}$/.test(compact) ? prefix + compact : compact);
    if (!code) continue;
    prefix = code.replace(/\d+$/, "");
    if (!codes.includes(code)) codes.push(code);
  }
  return codes;
}

export function formatCourseCode(code = "") {
  return code.replace(/^([A-Z]+)(\d+)$/, "$1 $2");
}

// The code a paper is filed under: its current code when the old one has a known match, even if
// that course is not confirmed yet (e.g. HPT 4506 → HPT 4503).
export function canonicalCode(code) {
  return OLD_CODES[code] || code;
}

export function getCourse(code) {
  return COURSE_BY_CODE.get(canonicalCode(code)) || null;
}

// Current courses a paper belongs to (usually one), after mapping old codes. Cached per paper:
// building the course lists asks this of every paper in the archive several times.
const coursesOfPaper = new WeakMap();
export function paperCourses(paper) {
  if (!coursesOfPaper.has(paper)) {
    coursesOfPaper.set(paper, [...new Set(paperCourseCodes(paper.courseCode).map(getCourse).filter(Boolean))]);
  }
  return coursesOfPaper.get(paper);
}

export function oldCodesFor(code) {
  return Object.keys(OLD_CODES).filter((old) => OLD_CODES[old] === code);
}

const codePrefix = (code) => code.replace(/\d+$/, "");

export function departmentListsCourse(department, code) {
  const entry = DEPARTMENT_COURSES[department];
  return Boolean(entry && (entry.prefixes.includes(codePrefix(code)) || entry.shared.includes(code)));
}

export function coursesFor(department, year, semester) {
  return COURSES.filter(
    (course) =>
      course.year === year &&
      course.semesters.includes(semester) &&
      departmentListsCourse(department, course.code)
  );
}

// Every paper filed under a current course, newest first, with shared copies merged.
export function papersForCourse(papers, code) {
  const own = papers.filter((paper) => paperCourses(paper).some((course) => course.code === code));
  return sortPapers(mergeSharedPapers(own), "newest");
}

// Papers filed under this department / year / semester that don't belong to one of the
// department's listed courses: old or unconfirmed codes, and courses the department isn't known to
// take (e.g. a copy of a Biology paper filed under Computing). For these, the year and semester
// the paper was filed under are all we have. Returns one group per code, sorted by code.
export function otherPaperGroups(papers, department, year, semester) {
  const groups = new Map();
  for (const paper of papers) {
    if ((paper.departmentFull || paper.department) !== department) continue;
    if (paper.yearNumber !== year || paper.semesterNumber !== semester) continue;
    const courses = paperCourses(paper);
    if (courses.some((course) => departmentListsCourse(department, course.code))) continue;
    const own = paperCourseCodes(paper.courseCode)[0] || "";
    const code = courses[0]?.code || (own && canonicalCode(own));
    const key = code || paper.courseCode || paper.title;
    if (!groups.has(key)) groups.set(key, { code, papers: [] });
    groups.get(key).papers.push(paper);
  }
  return [...groups.values()]
    .map(({ code, papers: list }) => ({
      code,
      title: COURSE_BY_CODE.get(code)?.title || titleFromPapers(list, code),
      papers: sortPapers(mergeSharedPapers(list), "newest"),
    }))
    .sort((a, b) => a.code.localeCompare(b.code) || a.title.localeCompare(b.title));
}

// A name for a code that is not a current course: the most common title on its papers. Papers on
// the code itself count double (HPT 4503 is named after HPT 4503 papers, not HPT 4506 ones); ties
// go to the shorter title ("… Harm" over "… Harm (Part II)").
function titleFromPapers(papers, code) {
  const titles = new Map();
  for (const paper of papers) {
    const weight = paperCourseCodes(paper.courseCode).includes(code) ? 2 : 1;
    titles.set(paper.title, (titles.get(paper.title) || 0) + weight);
  }
  return [...titles].sort(([a, m], [b, n]) => n - m || a.length - b.length)[0]?.[0] || "";
}

// Papers filed under `code` (or an old code matched to it) that match no current course.
export function papersForOldCode(papers, code) {
  const own = papers.filter(
    (paper) =>
      !paperCourses(paper).length &&
      paperCourseCodes(paper.courseCode).some((paperCode) => canonicalCode(paperCode) === code)
  );
  return sortPapers(mergeSharedPapers(own), "newest");
}

// Everything a course view shows, for a current course or an older code. Accepts any spelling of
// the code ("ict 3301", "MAP1302"). null when the code is unknown and has no papers.
export function courseView(papers, value) {
  const code = canonicalCode(normalizeCourseCode(value));
  if (!code) return null;
  const course = COURSE_BY_CODE.get(code) || null;
  const list = course ? papersForCourse(papers, code) : papersForOldCode(papers, code);
  if (!course && !list.length) return null;
  return {
    code,
    course,
    title: course?.title || titleFromPapers(list, code),
    papers: list,
    oldCodes: oldCodesFor(code),
  };
}

// Current courses whose code or title contains the search text ("ict33", "human computer").
export function findCourses(query = "") {
  const text = compactText(query);
  if (text.length < 3) return [];
  return COURSES.filter(
    (course) => compactText(course.code).includes(text) || compactText(course.title).includes(text)
  );
}

// "ICT3301 Human Computer Interaction - Past Papers.zip"
export function courseZipName(view) {
  return safeFileName(`${view.code} ${view.title} - Past Papers`) + ".zip";
}

// "MAP1302 Differential Equations I - February April 2025.pdf"; uses the code printed on the paper.
export function paperZipEntryName(paper) {
  const code = paperCourseCodes(paper.courseCode).join(" ") || paper.courseCode || "";
  return safeFileName([`${code} ${paper.title}`, paper.examPeriod].filter(Boolean).join(" - ")) + ".pdf";
}

function safeFileName(value) {
  return String(value).replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 150);
}
