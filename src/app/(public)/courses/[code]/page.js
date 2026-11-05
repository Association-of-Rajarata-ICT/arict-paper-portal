import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import CodeBoxes from "@/components/CodeBoxes";
import PaperListItem from "@/components/PaperListItem";
import RequestPaperButton from "@/components/RequestPaperButton";
import { departments } from "@/data/departments";
import {
  canonicalCode,
  formatCourseCode,
  getCourse,
  normalizeCourseCode,
  oldCodesFor,
  papersForCourse,
  papersForOldCode,
} from "@/lib/curriculum";
import { pageMetadata } from "@/lib/seo";
import { getPublicPapers } from "@/lib/server/publicPapers";

export const dynamic = "force-dynamic";

const semesterLabel = (semester) => `Semester ${semester === 1 ? "I" : "II"}`;

async function loadCourse(param) {
  const code = normalizeCourseCode(decodeURIComponent(param));
  if (!code) return null;
  if (canonicalCode(code) !== code) return { redirect: canonicalCode(code) };
  const course = getCourse(code);
  const papers = await getPublicPapers();
  if (course) return { code, course, papers: papersForCourse(papers, code) };
  const old = papersForOldCode(papers, code);
  return old.length ? { code, course: null, papers: old } : null;
}

export async function generateMetadata({ params }) {
  const { code } = await params;
  const data = await loadCourse(code).catch(() => null);
  if (!data || data.redirect) return pageMetadata(`/courses/${code}`, { title: "Course Not Found", noIndex: true });
  const title = data.course?.title || data.papers[0]?.title || "";
  return pageMetadata(`/courses/${data.code}`, {
    title: `${formatCourseCode(data.code)} ${title} Past Papers`,
    description: `All ${formatCourseCode(data.code)} ${title} past papers in the ARICT archive, newest first. Preview or download each Rajarata University examination paper.`,
  });
}

export default async function CoursePage({ params, searchParams }) {
  const { code: param } = await params;
  const query = await searchParams;
  const data = await loadCourse(param);
  if (!data) notFound();

  const from = new URLSearchParams();
  for (const key of ["department", "year", "semester"]) if (query[key]) from.set(key, query[key]);
  const back = from.toString() ? `?${from}` : "";
  if (data.redirect) permanentRedirect(`/courses/${data.redirect}${back}`);

  const { code, course, papers } = data;
  const title = course?.title || papers[0]?.title || "";
  const fromDepartment = departments.find((dept) => dept.id === query.department);
  const backLabel =
    fromDepartment && query.year && query.semester
      ? `${fromDepartment.name} · Year ${query.year} · ${semesterLabel(Number(query.semester))}`
      : "Courses";
  const oldCodes = oldCodesFor(code);
  const facts = course
    ? [
        `Year ${course.year}`,
        course.preSemester ? "Pre-semester" : course.semesters.map(semesterLabel).join(" and "),
      ]
    : [];

  return (
    <section className="course-page" id="course-page">
      <div className="page-head">
        <div className="container course-head">
          <Breadcrumb
            items={[
              { label: backLabel, href: `/courses${back}` },
              { label: formatCourseCode(code) },
            ]}
          />
          <CodeBoxes code={code} size="lg" />
          <h1 className="text-headline-lg">{title}</h1>
          <p className="page-head-meta">
            {facts.length > 0 && <>{facts.join(" · ")} · </>}
            <strong>{papers.length}</strong> past paper{papers.length === 1 ? "" : "s"}
          </p>
          {oldCodes.length > 0 && (
            <p className="course-head-aliases">
              Includes papers under the older code{oldCodes.length === 1 ? "" : "s"}{" "}
              {oldCodes.map((old, index) => (
                <span key={old}>
                  {index > 0 && " "}
                  <span className="code-tag">{formatCourseCode(old)}</span>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="container course-body">
        {!course && (
          <div className="notice" role="status">
            <span className="material-symbols-outlined" aria-hidden="true">
              history
            </span>
            <span>
              This code is not in the 2026 timetables. It may be an older course, or one we are
              still matching to the current curriculum.
            </span>
          </div>
        )}

        {papers.length > 0 ? (
          <div className="results-list">
            {papers.map((paper) => (
              <PaperListItem key={paper.id} paper={paper} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">
              <span className="material-symbols-outlined">description</span>
            </span>
            <h2>No papers for this course yet</h2>
            <p>
              If you have a past paper for {formatCourseCode(code)}, you can{" "}
              <Link href="/contribute">upload it</Link>, or request it and ARICT will try to add it.
            </p>
            <div className="empty-state-actions">
              <RequestPaperButton>Request this paper</RequestPaperButton>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
