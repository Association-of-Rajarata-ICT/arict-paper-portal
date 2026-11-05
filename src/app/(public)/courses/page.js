import Link from "next/link";
import { departments } from "@/data/departments";
import { coursesFor, formatCourseCode, otherPaperGroups, papersForCourse } from "@/lib/curriculum";
import { getPaperRouteId } from "@/lib/papers";
import { pageMetadata } from "@/lib/seo";
import { getPublicPapers } from "@/lib/server/publicPapers";

export const dynamic = "force-dynamic";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];
const semesterLabel = (semester) => `Semester ${semester === 1 ? "I" : "II"}`;

function readSelection(params) {
  const department = departments.find((dept) => dept.id === params.department) || null;
  const year = YEARS.find((value) => String(value) === params.year) || null;
  const semester = SEMESTERS.find((value) => String(value) === params.semester) || null;
  return { department, year, semester };
}

function selectionQuery({ department, year, semester }) {
  const query = new URLSearchParams();
  if (department) query.set("department", department.id);
  if (year) query.set("year", String(year));
  if (semester) query.set("semester", String(semester));
  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  return pageMetadata("/courses", { noIndex: Object.keys(params).length > 0 });
}

function PickerRow({ label, options, selection, field }) {
  return (
    <div className="course-picker-row">
      <span className="course-picker-label">{label}</span>
      <div className="course-picker-options">
        {options.map((option) => {
          const active = selection[field] === option.value;
          return (
            <Link
              key={option.label}
              href={`/courses${selectionQuery({ ...selection, [field]: active ? null : option.value })}`}
              className={`course-picker-option${active ? " is-active" : ""}`}
              aria-current={active ? "true" : undefined}
              scroll={false}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function CourseRow({ href, code, title, note, count }) {
  return (
    <li>
      <Link href={href} className="course-row">
        <span className="code-tag">{code ? formatCourseCode(code) : "—"}</span>
        <span className="course-row-text">
          <span className="course-row-title">{title}</span>
          {note && <span className="course-row-note">{note}</span>}
        </span>
        <span className={`course-row-count${count === 0 ? " is-empty" : ""}`}>
          {count === 0 ? (
            "No papers yet"
          ) : (
            <>
              <strong>{count}</strong> paper{count === 1 ? "" : "s"}
            </>
          )}
        </span>
        <span className="material-symbols-outlined course-row-arrow" aria-hidden="true">
          arrow_forward
        </span>
      </Link>
    </li>
  );
}

export default async function CoursesPage({ searchParams }) {
  const selection = readSelection(await searchParams);
  const { department, year, semester } = selection;
  const complete = Boolean(department && year && semester);

  let papers = [];
  let loadError = false;
  if (complete) {
    try {
      papers = await getPublicPapers();
    } catch {
      loadError = true;
      console.error("The courses page could not load the paper archive.");
    }
  }

  const back = selectionQuery(selection);
  const courses = complete
    ? coursesFor(papers, department.name, year, semester).map((course) => ({
        ...course,
        count: papersForCourse(papers, course.code).length,
      }))
    : [];
  const others = complete ? otherPaperGroups(papers, department.name, year, semester) : [];
  const otherCount = others.reduce((sum, group) => sum + group.papers.length, 0);

  return (
    <section className="courses-page" id="courses-page">
      <div className="page-head">
        <div className="container courses-head">
          <h1 className="text-headline-lg">Courses</h1>
          <p className="page-head-meta">
            Choose your department, year and semester to see its courses, then open a course for
            all of its past papers.
          </p>
        </div>
      </div>

      <div className="container courses-body">
        <div className="course-picker" aria-label="Choose a semester">
          <PickerRow
            label="Department"
            field="department"
            selection={selection}
            options={departments.map((dept) => ({ label: dept.name, value: dept }))}
          />
          <PickerRow
            label="Year"
            field="year"
            selection={selection}
            options={YEARS.map((value) => ({ label: `Year ${value}`, value }))}
          />
          <PickerRow
            label="Semester"
            field="semester"
            selection={selection}
            options={SEMESTERS.map((value) => ({ label: semesterLabel(value), value }))}
          />
        </div>

        {!complete ? (
          <p className="courses-hint">Pick a department, year and semester to see the course list.</p>
        ) : loadError ? (
          <div className="notice" role="status">
            <span className="material-symbols-outlined" aria-hidden="true">
              cloud_off
            </span>
            <span>
              We couldn&rsquo;t reach the paper archive. Refresh the page to try again.
            </span>
          </div>
        ) : (
          <>
            <div className="section-head courses-section-head">
              <div>
                <h2 className="text-headline-sm">
                  {department.name} · Year {year} · {semesterLabel(semester)}
                </h2>
                <p>
                  {courses.length === 0
                    ? "Course list not confirmed yet"
                    : `${courses.length} course${courses.length === 1 ? "" : "s"} from the 2026 timetables`}
                </p>
              </div>
            </div>

            {courses.length > 0 ? (
              <ul className="course-index">
                {courses.map((course) => (
                  <CourseRow
                    key={course.code}
                    href={`/courses/${course.code}${back}`}
                    code={course.code}
                    title={course.title}
                    note={
                      course.preSemester
                        ? "Pre-semester course"
                        : course.semesters.length > 1
                          ? "Runs in both semesters"
                          : ""
                    }
                    count={course.count}
                  />
                ))}
              </ul>
            ) : (
              <div className="notice" role="status">
                <span className="material-symbols-outlined" aria-hidden="true">
                  pending
                </span>
                <span>
                  The course list for this semester hasn&rsquo;t been confirmed yet.
                  {otherCount > 0 && " Papers filed here are under Other papers below."}
                </span>
              </div>
            )}

            {others.length > 0 && (
              <details className="other-papers" open={courses.length === 0}>
                <summary>
                  <span className="material-symbols-outlined other-papers-chevron" aria-hidden="true">
                    expand_more
                  </span>
                  <span className="other-papers-title">Other papers</span>
                  <span className="other-papers-count">{otherCount}</span>
                  <span className="other-papers-hint">
                    Older course codes, or courses we are still confirming
                  </span>
                </summary>
                <ul className="course-index">
                  {others.map((group) => (
                    <CourseRow
                      key={group.code || group.title}
                      href={
                        group.code
                          ? `/courses/${group.code}${back}`
                          : `/paper/${encodeURIComponent(getPaperRouteId(group.papers[0]))}`
                      }
                      code={group.code}
                      title={group.title}
                      count={group.papers.length}
                    />
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </div>
    </section>
  );
}
