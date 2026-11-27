"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import DepartmentCard from "@/components/DepartmentCard";
import BrowseByExamPeriod from "@/components/BrowseByExamPeriod";
import PaperCard from "@/components/PaperCard";
import RequestPaperButton from "@/components/RequestPaperButton";
import { departmentKey, departments } from "@/data/departments";
import { summarizeArchive } from "@/lib/archiveSummary";
import { fetchAllPapers, getPaperRouteId, paperDepartments } from "@/lib/papers";

// Shown on the sheets when there are no papers to show yet.
const HOW_IT_WORKS = [
  { word: "Search", text: "Type a course code or module name" },
  { word: "Filter", text: "Pick a department, year and semester" },
  { word: "Save", text: "Preview the paper, then download the PDF" },
];

// The newest papers, fanned out like sheets on a desk. The front sheet is the latest one.
function PaperStack({ papers, loading }) {
  const sheets = papers.slice(0, 3);

  if (loading || sheets.length === 0) {
    return (
      <ul className="paper-stack" aria-hidden={loading || undefined}>
        {HOW_IT_WORKS.map((step) => (
          <li key={step.word} className="stack-item">
            <div className="stack-sheet">
              <span className="exam-sheet-uni">ARICT past paper archive</span>
              <span className="exam-sheet-code">{loading ? "…" : step.word}</span>
              <span className="stack-sheet-title">{loading ? "Loading papers" : step.text}</span>
              <span className="exam-sheet-lines" aria-hidden="true" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="paper-stack" aria-label="Newest papers">
      {sheets.map((paper, index) => (
        <li key={paper.id} className="stack-item" data-dept={departmentKey(paperDepartments(paper)[0])}>
          <Link href={`/paper/${encodeURIComponent(getPaperRouteId(paper))}`} className="stack-sheet">
            {index === 0 && <span className="highlight-tag">Just added</span>}
            <span className="exam-sheet-uni">Rajarata University of Sri Lanka</span>
            <span className="exam-sheet-code">{paper.courseCode}</span>
            <span className="stack-sheet-title">{paper.title}</span>
            {paper.examPeriod && <span className="exam-sheet-period">{paper.examPeriod}</span>}
            <span className="exam-sheet-lines" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home({ summary = null }) {
  const [departmentList, setDepartmentList] = useState(() => summary?.departmentList || departments);
  const [examPeriods, setExamPeriods] = useState(() => summary?.examPeriods || []);
  const [statsLoading, setStatsLoading] = useState(summary === null);
  const [recentPapers, setRecentPapers] = useState(() => summary?.recentPapers || []);
  const [tally, setTally] = useState(() => summary?.tally || null);

  useEffect(() => {
    if (summary !== null) return;
    let isMounted = true;

    const fetchCounts = async () => {
      setStatsLoading(true);
      try {
        const papers = await fetchAllPapers();
        if (!isMounted) return;

        const next = summarizeArchive(papers);
        setDepartmentList(next.departmentList);
        setExamPeriods(next.examPeriods);
        setRecentPapers(next.recentPapers);
        setTally(next.tally);
      } catch {
        if (isMounted) {
          setDepartmentList(departments.map((dept) => ({ ...dept, paperCount: 0, courseCount: 0 })));
          setExamPeriods([]);
          setRecentPapers([]);
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
  }, [summary]);

  return (
    <>
      <section className="home-hero" id="hero-section">
        <div className="container home-hero-grid">
          <div className="home-hero-main">
            <h1 className="home-hero-title">ARICT Past Paper Portal</h1>
            <p className="home-hero-lede">
              Past examination papers for Rajarata University Applied Sciences students, organized by
              department, course code, academic year and semester. Preview in the browser or download
              the PDF.
            </p>
            <SearchBar />

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

          <PaperStack papers={recentPapers} loading={statsLoading} />
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
          <ul className="dept-grid">
            {departmentList.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} loading={statsLoading} />
            ))}
          </ul>
        </div>
      </section>

      {recentPapers.length > 0 && (
        <section className="home-section" id="recent-section" aria-labelledby="recent-heading">
          <div className="container">
            <div className="section-head">
              <div>
                <h2 id="recent-heading" className="text-headline-md">
                  Recently added
                </h2>
                <p>The newest papers in the archive.</p>
              </div>
              <Link href="/search" className="link-arrow">
                Browse and filter
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
            <div className="recent-grid">
              {recentPapers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="home-section" id="exam-periods-section">
        <div className="container">
          <BrowseByExamPeriod periods={examPeriods} linkBase="/search" loading={statsLoading} />
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Can&rsquo;t find the paper you need?</h2>
              <p>Tell ARICT which one, or share a paper you have so the next batch can use it.</p>
            </div>
            <div className="cta-band-actions">
              <RequestPaperButton className="btn btn-highlight btn-lg" />
              <Link href="/contribute" className="btn btn-on-brand btn-lg">
                <span className="material-symbols-outlined" aria-hidden="true">
                  upload_file
                </span>
                Contribute a paper
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container home-about">
          <h2 className="text-headline-md">Find your next revision resource</h2>
          <div>
            <p>
              The ARICT Past Paper Portal is a free, student-run archive for the Faculty of Applied
              Sciences at Rajarata University of Sri Lanka. It collects end-of-semester examination
              papers from the Biological Sciences, Chemical Sciences, Computing, Health Promotion and
              Physical Sciences departments, filed by course code, academic year, semester and exam
              period, so you can revise from real papers before your exams.
            </p>
            <p>
              <Link href="/search">Browse past examination papers</Link>, explore the{" "}
              <Link href="/faculty">Faculty of Applied Sciences departments</Link>, or read our{" "}
              <Link href="/help">guide to finding and downloading papers</Link>.
            </p>
            <p>
              Learn <Link href="/about">about ARICT and the archive</Link> or{" "}
              <Link href="/contribute">upload a past paper you have</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
