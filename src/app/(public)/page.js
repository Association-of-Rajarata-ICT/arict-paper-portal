"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import DepartmentCard from "@/components/DepartmentCard";
import BrowseByExamPeriod from "@/components/BrowseByExamPeriod";
import CodeBoxes from "@/components/CodeBoxes";
import { departments } from "@/data/departments";
import {
  applyDepartmentStats,
  fetchAllPapers,
  getPaperRouteId,
  sortExamPeriods,
  sortPapersByDate,
} from "@/lib/papers";

function getPaperHref(paper) {
  const encodedId = encodeURIComponent(getPaperRouteId(paper));
  return `/paper/${encodedId}?dept=${encodeURIComponent(
    paper.departmentFull || paper.department || ""
  )}`;
}

function CoverSheet({ paper, loading }) {
  if (loading) {
    return (
      <div className="cover-sheet" aria-hidden="true">
        <div className="cover-sheet-head">
          <span className="skeleton" style={{ width: 150, height: 12 }} />
        </div>
        <span className="skeleton" style={{ width: 200, height: 36 }} />
        <span className="skeleton" style={{ width: "85%", height: 22, marginTop: 20 }} />
        <span className="skeleton" style={{ width: "100%", height: 104, marginTop: 20 }} />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="cover-sheet">
        <div className="cover-sheet-head">
          <span className="cover-sheet-org">
            ARICT past paper archive
            <br />
            Instructions to candidates
          </span>
        </div>
        <ol className="cover-instructions">
          <li>Type a course code or module name in the search box.</li>
          <li>Narrow the list by department, academic year and semester.</li>
          <li>Open a paper to preview it, then download the PDF.</li>
          <li>Can&rsquo;t find it? Request the paper and ARICT will look for it.</li>
        </ol>
      </div>
    );
  }

  const fields = [
    { label: "Department", value: paper.departmentFull || paper.department },
    { label: "Academic year", value: paper.academicYear },
    { label: "Semester", value: paper.semester },
    { label: "Exam period", value: paper.examPeriod },
  ];

  return (
    <Link href={getPaperHref(paper)} className="cover-sheet" aria-label={`Latest addition: ${paper.courseCode} ${paper.title}`}>
      <div className="cover-sheet-head">
        <span className="cover-sheet-org">
          ARICT past paper archive
          <br />
          Latest addition
        </span>
        <span className="stamp stamp--land">Just added</span>
      </div>
      <span className="cover-sheet-label">Course code</span>
      <CodeBoxes code={paper.courseCode} size="lg" />
      <h2 className="cover-sheet-title">{paper.title}</h2>
      <dl className="cover-fields">
        {fields.map((field) => (
          <div key={field.label} className="cover-field">
            <dt>{field.label}</dt>
            <dd>{field.value || "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="cover-sheet-foot">
        Open paper
        <span className="material-symbols-outlined" aria-hidden="true">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  const [departmentList, setDepartmentList] = useState(departments);
  const [examPeriods, setExamPeriods] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [latestPaper, setLatestPaper] = useState(null);
  const [tally, setTally] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      setStatsLoading(true);
      try {
        const papers = await fetchAllPapers();
        const periodSet = new Set(
          papers.map((paper) => paper.examPeriod).filter(Boolean)
        );
        const newest = sortPapersByDate(papers)[0];

        if (!isMounted) return;

        setDepartmentList(applyDepartmentStats(departments, papers));
        setExamPeriods(sortExamPeriods(Array.from(periodSet)));
        setLatestPaper(newest && newest.createdAt ? newest : null);
        setTally({
          papers: papers.length,
          subjects: new Set(papers.map((paper) => paper.courseCode).filter(Boolean)).size,
          periods: periodSet.size,
        });
      } catch (error) {
        if (isMounted) {
          setDepartmentList(
            departments.map((dept) => ({
              ...dept,
              paperCount: 0,
              courseCount: 0,
            }))
          );
          setExamPeriods([]);
          setLatestPaper(null);
          setTally(null);
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    };

    fetchCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <section className="home-hero" id="hero-section">
        <div className="container home-hero-grid">
          <div className="home-hero-main">
            <h1 className="home-hero-title">
              Every past paper, <em>one search</em> away.
            </h1>
            <p className="home-hero-lede">
              Past examination papers for ARICT students, organized by department,
              course code, academic year and semester. Preview in the browser or
              download the PDF.
            </p>
            <SearchBar />

            <div className="quick-links" aria-label="Browse by department">
              <span className="quick-links-label">Browse</span>
              {departments.map((dept) => (
                <Link
                  key={dept.id}
                  href={`/search?q=${encodeURIComponent(dept.name)}`}
                  className="quick-link"
                >
                  {dept.name}
                </Link>
              ))}
            </div>

            {tally && tally.papers > 0 && (
              <dl className="archive-tally" aria-label="Archive totals">
                <div>
                  <dt>papers</dt>
                  <dd>{tally.papers.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>subjects</dt>
                  <dd>{tally.subjects.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>exam periods</dt>
                  <dd>{tally.periods.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>departments</dt>
                  <dd>{departments.length}</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="home-hero-aside">
            <CoverSheet paper={latestPaper} loading={statsLoading} />
          </div>
        </div>
      </section>

      <section className="home-section" id="departments-section" aria-labelledby="departments-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="departments-heading" className="text-headline-md">
                Departments
              </h2>
              <p>Every paper in the archive, filed under its department.</p>
            </div>
            <Link href="/search" className="link-arrow">
              All papers
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>
          <ul className="dept-index">
            {departmentList.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} loading={statsLoading} />
            ))}
          </ul>
        </div>
      </section>

      <section className="home-section" id="exam-periods-section">
        <div className="container">
          <BrowseByExamPeriod periods={examPeriods} linkBase="/search" loading={statsLoading} />
        </div>
      </section>
    </>
  );
}
