import Link from "next/link";
import { departments } from "@/data/departments";
import { COURSES } from "@/data/curriculum";
import { formatCourseCode, otherCourses, papersForCourse } from "@/lib/curriculum";
import { pageMetadata } from "@/lib/seo";
import { getPublicPapers } from "@/lib/server/publicPapers";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("/faculty");

const courseRow = ({ code, title }, count) => ({
  key: code,
  href: `/search?course=${code}`,
  code: formatCourseCode(code),
  title,
  count,
});

export default async function FacultyPage() {
  // Plain server-rendered links: the only route search engines have to every course page.
  let courses = [];
  let others = { courses: [], uncoded: [] };
  try {
    const papers = await getPublicPapers();
    courses = COURSES.map((course) => ({ ...course, count: papersForCourse(papers, course.code).length }))
      .filter((course) => course.count > 0);
    others = otherCourses(papers);
  } catch {
    console.error("The faculty page could not load the course list.");
  }
  const groups = [...new Set(courses.map((course) => course.year))].sort().map((year) => ({
    label: `Year ${year}`,
    rows: courses.filter((course) => course.year === year).map((course) => courseRow(course, course.count)),
  }));
  const otherRows = [
    ...others.courses.map((course) => courseRow(course, course.papers.length)),
    ...others.uncoded.map((paper) => ({
      key: paper.id,
      href: `/paper/${paper.docId}`,
      code: paper.courseCode || "—",
      title: paper.examPeriod ? `${paper.title} (${paper.examPeriod})` : paper.title,
      count: 1,
    })),
  ];
  if (otherRows.length) groups.push({ label: "Older and other course codes", rows: otherRows });
  return (
    <section className="about-page faculty-page" id="faculty-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">Faculty of Applied Sciences</h1>
          <p className="text-body-lg">
            Browse available past examination papers for the five departments of
            the Faculty of Applied Sciences at Rajarata University of Sri Lanka.
            ARICT volunteers organise the archive for students&apos; revision.
          </p>
        </div>
        <div className="faculty-grid">
          {departments.map((department) => (
            <section key={department.id} className="about-section" data-dept={department.id}>
              <span className="dept-icon" aria-hidden="true">
                <span className="material-symbols-outlined">{department.icon}</span>
              </span>
              <h2>{department.name}</h2>
              <p>{department.description}</p>
              <p><Link href={"/search?q=" + encodeURIComponent(department.name)}>
                Browse {department.name} past papers
              </Link></p>
            </section>
          ))}
        </div>
        {groups.length > 0 && (
          <section aria-labelledby="all-courses-heading">
            <h2 className="text-headline-md" id="all-courses-heading">Past papers by course</h2>
            {groups.map((group) => (
              <details className="other-papers" key={group.label}>
                <summary>
                  <span className="material-symbols-outlined other-papers-chevron" aria-hidden="true">
                    expand_more
                  </span>
                  <span className="other-papers-title">{group.label}</span>
                  <span className="other-papers-count">{group.rows.length}</span>
                </summary>
                <ul className="course-index">
                  {group.rows.map((row) => (
                    <li key={row.key}>
                      <Link href={row.href} className="course-row" prefetch={false}>
                        <span className="code-tag">{row.code}</span>
                        <span className="course-row-text">
                          <span className="course-row-title">{row.title}</span>
                        </span>
                        <span className="course-row-count">
                          <strong>{row.count}</strong> paper{row.count === 1 ? "" : "s"}
                        </span>
                        <span className="material-symbols-outlined course-row-arrow" aria-hidden="true">
                          arrow_forward
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </section>
        )}
        <p className="legal-note">
          Availability varies by subject and examination period. Read our{" "}
          <Link href="/help">guide to finding past papers</Link> or{" "}
          <Link href="/contact">contact ARICT about a missing paper</Link>.
        </p>
      </div>
    </section>
  );
}
