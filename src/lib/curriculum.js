import { COURSES, DEPARTMENT_PREFIXES, OLD_CODES, SHARED_PREFIXES } from "@/data/curriculum";
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

// Current courses a paper belongs to (usually one), after mapping old codes.
export function paperCourses(paper) {
  return [...new Set(paperCourseCodes(paper.courseCode).map(getCourse).filter(Boolean))];
}

export function oldCodesFor(code) {
  return Object.keys(OLD_CODES).filter((old) => OLD_CODES[old] === code);
}

const codePrefix = (code) => code.replace(/\d+$/, "");

function homeDepartment(code) {
  return Object.keys(DEPARTMENT_PREFIXES).find((department) =>
    DEPARTMENT_PREFIXES[department].includes(codePrefix(code))
  );
}

function departmentOwnsCode(department, code) {
  return SHARED_PREFIXES.includes(codePrefix(code)) || homeDepartment(code) === department;
}

// Another department's courses that this department shares: the same sitting is filed under both
// departments (e.g. the Chemistry courses Biological Sciences students sit). Papers filed under
// just one other department are treated as misfiled, not shared.
function sharedCourseCodes(papers, department) {
  const sittings = new Set();
  for (const paper of papers) {
    for (const course of paperCourses(paper)) {
      sittings.add(`${course.code}|${paper.examPeriod}|${paper.departmentFull || paper.department}`);
    }
  }
  const shared = new Set();
  for (const paper of papers) {
    if ((paper.departmentFull || paper.department) !== department) continue;
    for (const course of paperCourses(paper)) {
      const home = homeDepartment(course.code);
      if (home && home !== department && sittings.has(`${course.code}|${paper.examPeriod}|${home}`)) {
        shared.add(course.code);
      }
    }
  }
  return shared;
}

export function coursesFor(papers, department, year, semester) {
  const shared = sharedCourseCodes(papers, department);
  return COURSES.filter(
    (course) =>
      course.year === year &&
      course.semesters.includes(semester) &&
      (departmentOwnsCode(department, course.code) || shared.has(course.code))
  );
}

// Every paper filed under a current course, newest first, with shared copies merged.
export function papersForCourse(papers, code) {
  const own = papers.filter((paper) => paperCourses(paper).some((course) => course.code === code));
  return sortPapers(mergeSharedPapers(own), "newest");
}

// Papers on this department / year / semester that match no current course. Their codes are old
// or still unconfirmed, so the year and semester the paper was filed under are all we have.
// Returns one group per code, sorted by code.
export function otherPaperGroups(papers, department, year, semester) {
  const groups = new Map();
  for (const paper of papers) {
    if ((paper.departmentFull || paper.department) !== department) continue;
    if (paper.yearNumber !== year || paper.semesterNumber !== semester) continue;
    if (paperCourses(paper).length) continue;
    const own = paperCourseCodes(paper.courseCode)[0] || "";
    const code = own && canonicalCode(own);
    const key = code || paper.courseCode || paper.title;
    if (!groups.has(key)) groups.set(key, { code, titles: new Map(), papers: [] });
    const group = groups.get(key);
    // Titles on the group's own code count double, so HPT 4503 is named after HPT 4503 papers.
    group.titles.set(paper.title, (group.titles.get(paper.title) || 0) + (own === code ? 2 : 1));
    group.papers.push(paper);
  }
  return [...groups.values()]
    .map(({ code, titles, papers: list }) => ({
      code,
      // Most common title; ties go to the shorter one ("… Harm" over "… Harm (Part II)").
      title: [...titles].sort(([a, m], [b, n]) => n - m || a.length - b.length)[0][0],
      papers: sortPapers(mergeSharedPapers(list), "newest"),
    }))
    .sort((a, b) => a.code.localeCompare(b.code) || a.title.localeCompare(b.title));
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
