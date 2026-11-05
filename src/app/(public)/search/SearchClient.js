"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import PaperCard from "@/components/PaperCard";
import PaperListItem from "@/components/PaperListItem";
import Pagination from "@/components/Pagination";
import CodeBoxes from "@/components/CodeBoxes";
import { departments } from "@/data/departments";
import { filterPapers } from "@/data/papers";
import {
  courseView,
  coursesFor,
  findCourses,
  formatCourseCode,
  normalizeCourseCode,
  otherPaperGroups,
  papersForCourse,
} from "@/lib/curriculum";
import {
  fetchAllPapers,
  getPaperRouteId,
  mergeSharedPapers,
  paperDepartments,
  PAPER_SORT_OPTIONS,
  sortAcademicYears,
  sortExamPeriods,
  sortPapers,
  sortSemesters,
} from "@/lib/papers";
import { openRequestPaper } from "@/lib/requestPaper";

function getDepartmentFilterFromQuery(searchQuery = "") {
  const trimmed = searchQuery.trim();
  if (!trimmed) return [];
  const match = departments.find(
    (dept) => dept.name.toLowerCase() === trimmed.toLowerCase()
  );
  return match ? [match.name] : [];
}

const LIST_PAGE_SIZE = 5;
const COMPACT_PAGE_SIZE = 9;

function ResultsSkeleton({ viewMode }) {
  const count = viewMode === "list" ? 4 : 6;
  return (
    <div
      className={viewMode === "list" ? "results-list" : "results-grid"}
      aria-busy="true"
      aria-label="Loading papers"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={viewMode === "list" ? "paper-row" : "skeleton-card"}>
          <span className="skeleton" style={{ width: 84, height: 24 }} />
          <div style={{ minWidth: 0 }}>
            <span className="skeleton" style={{ width: "80%", height: 18, marginTop: 14 }} />
            <span className="skeleton" style={{ width: "55%", height: 14, marginTop: 10 }} />
            <span className="skeleton" style={{ width: "40%", height: 14, marginTop: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const semesterLabel = (semester) => `Semester ${semester === 1 ? "I" : "II"}`;
const numberFrom = (label = "") => Number.parseInt(String(label).match(/\d+/)?.[0], 10) || null;

// One course in a ledger. Opening a course stays on this page (see openCourse).
function CourseRow({ code, title, note, count, href, onOpen }) {
  const handleClick = (event) => {
    if (!onOpen || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onOpen(code);
  };
  return (
    <li>
      <a href={href} className="course-row" onClick={handleClick}>
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
      </a>
    </li>
  );
}

const courseHref = (code) => `/search?course=${encodeURIComponent(code)}`;

// A semester's confirmed courses, then a fold with the papers we could not match to one.
function SemesterCourses({ semester, courses, others, onOpenCourse }) {
  const otherCount = others.reduce((sum, group) => sum + group.papers.length, 0);
  return (
    <section className="semester-block" aria-labelledby={`semester-${semester}-heading`}>
      <div className="section-head semester-block-head">
        <h2 className="text-headline-sm" id={`semester-${semester}-heading`}>
          {semesterLabel(semester)}
        </h2>
        <p>
          {courses.length === 0
            ? "Course list not confirmed yet"
            : `${courses.length} course${courses.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {courses.length > 0 ? (
        <ul className="course-index">
          {courses.map((course) => (
            <CourseRow
              key={course.code}
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
              href={courseHref(course.code)}
              onOpen={onOpenCourse}
            />
          ))}
        </ul>
      ) : (
        <p className="semester-block-empty">
          The course list for this semester hasn&rsquo;t been confirmed yet.
          {otherCount > 0 ? " Papers filed here are under Others." : ""}
        </p>
      )}

      {others.length > 0 && (
        <details className="other-papers" open={courses.length === 0}>
          <summary>
            <span className="material-symbols-outlined other-papers-chevron" aria-hidden="true">
              expand_more
            </span>
            <span className="other-papers-title">Others</span>
            <span className="other-papers-count">{otherCount}</span>
            <span className="other-papers-hint">
              Papers filed under this semester that we couldn&rsquo;t match to a current course,
              such as older course codes
            </span>
          </summary>
          <ul className="course-index">
            {others.map((group) => (
              <CourseRow
                key={group.code || group.title}
                code={group.code}
                title={group.title}
                count={group.papers.length}
                href={
                  group.code
                    ? courseHref(group.code)
                    : `/paper/${encodeURIComponent(getPaperRouteId(group.papers[0]))}`
                }
                onOpen={group.code ? onOpenCourse : null}
              />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

// Every paper of one course, with a button that downloads them all as one zip.
function CourseView({ view, loading, backLabel, onBack }) {
  const { code, course, title, papers, oldCodes } = view;
  const facts = course
    ? [
        `Year ${course.year}`,
        course.preSemester ? "Pre-semester" : course.semesters.map(semesterLabel).join(" and "),
      ]
    : [];
  const handleBack = (event) => {
    if (!onBack || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    onBack();
  };

  return (
    <section className="search-page course-view" id="course-view">
      <div className="page-head">
        <div className="container course-head">
          <div className="course-head-main">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <span className="breadcrumb-item">
                <a href="/search" onClick={handleBack}>
                  {backLabel}
                </a>
              </span>
              <span className="breadcrumb-item">
                <span className="material-symbols-outlined separator" aria-hidden="true">
                  chevron_right
                </span>
                <span className="current" aria-current="page">
                  {formatCourseCode(code)}
                </span>
              </span>
            </nav>
            <CodeBoxes code={code} size="lg" />
            <h1 className="text-headline-lg">{title}</h1>
            <p className="page-head-meta">
              {facts.length > 0 && <>{facts.join(" · ")} · </>}
              {loading ? (
                "Loading papers…"
              ) : (
                <>
                  <strong>{papers.length}</strong> past paper{papers.length === 1 ? "" : "s"}
                </>
              )}
            </p>
            {oldCodes.length > 0 && (
              <p className="course-head-aliases">
                Includes papers under the older code{oldCodes.length === 1 ? "" : "s"}
                {oldCodes.map((old) => (
                  <span key={old} className="code-tag">
                    {formatCourseCode(old)}
                  </span>
                ))}
              </p>
            )}
          </div>

          {!loading && papers.length > 0 && (
            <div className="course-head-actions">
              <a
                href={`/api/course-zip/${encodeURIComponent(code)}`}
                className="btn btn-primary btn-lg"
                download
                id="course-download-all"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  folder_zip
                </span>
                Download all ({papers.length})
              </a>
              <p className="course-head-actions-note">Every paper in one .zip file</p>
            </div>
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
              This code isn&rsquo;t in the 2026 timetables. It may be an older course, or one we
              are still matching to the current curriculum.
            </span>
          </div>
        )}

        {loading ? (
          <ResultsSkeleton viewMode="list" />
        ) : papers.length > 0 ? (
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
              If you have a {formatCourseCode(code)} past paper, please contribute it, or request it
              and ARICT will try to add it.
            </p>
            <div className="empty-state-actions">
              <a href="/contribute" className="btn btn-secondary">
                <span className="material-symbols-outlined" aria-hidden="true">
                  upload_file
                </span>
                Contribute a paper
              </a>
              <button type="button" className="btn btn-primary" onClick={openRequestPaper}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  note_add
                </span>
                Request this paper
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SearchResultsContent({ initialPapers }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const courseParam = searchParams.get("course") || "";
  const yearsParam = searchParams.get("years") || "";
  const initialExamPeriods = yearsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const initialDepartments = getDepartmentFilterFromQuery(query);

  const [viewMode, setViewMode] = useState("compact"); // compact, list
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartments, setSelectedDepartments] = useState(initialDepartments);
  const [selectedExamPeriods, setSelectedExamPeriods] = useState(initialExamPeriods);
  const [selectedAcademicYears, setSelectedAcademicYears] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [papers, setPapers] = useState(initialPapers || []);
  const [loading, setLoading] = useState(initialPapers === null);
  const [loadError, setLoadError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsTopRef = useRef(null);
  const skipScrollRef = useRef(true);
  // True once a course was opened from this page, so "back" can return to the list as it was.
  const [openedCourse, setOpenedCourse] = useState(false);

  useEffect(() => {
    setSelectedDepartments(getDepartmentFilterFromQuery(query));
    setSelectedExamPeriods(
      yearsParam
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    );
    if (!query && !yearsParam) {
      setSelectedAcademicYears([]);
      setSelectedSemesters([]);
    }
    setCurrentPage(1);
  }, [query, yearsParam]);

  useEffect(() => {
    if (initialPapers !== null) return;
    let isMounted = true;

    const fetchPapers = async () => {
      try {
        const data = await fetchAllPapers();

        if (isMounted) {
          setPapers(data);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error?.message || "Failed to load papers.");
          setPapers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPapers();

    return () => {
      isMounted = false;
    };
  }, [initialPapers]);

  // One entry per shared paper, tagged with every department that offers it.
  const mergedPapers = useMemo(() => mergeSharedPapers(papers), [papers]);
  const queryResults = useMemo(() => filterPapers(mergedPapers, query), [mergedPapers, query]);

  // Applies every selected filter group except `skip`, so facet counts show
  // how many papers each option would add given the other selections.
  const applyFilters = useCallback(
    (list, skip = null) =>
      list.filter((p) => {
        const variants = p.variants || [p];
        const anySelected = (selected, values) =>
          selected.length === 0 || values.some((value) => selected.includes(value));
        if (skip !== "departments" && !anySelected(selectedDepartments, paperDepartments(p))) {
          return false;
        }
        if (
          skip !== "examPeriods" &&
          selectedExamPeriods.length > 0 &&
          !selectedExamPeriods.includes(p.examPeriod)
        ) {
          return false;
        }
        if (
          skip !== "academicYears" &&
          !anySelected(selectedAcademicYears, variants.map((v) => v.academicYear))
        ) {
          return false;
        }
        if (skip !== "semesters" && !anySelected(selectedSemesters, variants.map((v) => v.semester))) {
          return false;
        }
        return true;
      }),
    [selectedDepartments, selectedExamPeriods, selectedAcademicYears, selectedSemesters]
  );

  const displayResults = useMemo(
    () => sortPapers(applyFilters(queryResults), sortBy),
    [applyFilters, queryResults, sortBy]
  );

  const facetCounts = useMemo(() => {
    // getValues returns every value a (merged) paper carries; each is counted once per paper.
    const tally = (skip, getValues) => {
      const counts = {};
      applyFilters(queryResults, skip).forEach((paper) => {
        new Set(getValues(paper).map((value) => (value || "").trim())).forEach((value) => {
          if (value) counts[value] = (counts[value] || 0) + 1;
        });
      });
      return counts;
    };
    const fromVariants = (key) => (p) => (p.variants || [p]).map((v) => v[key]);
    return {
      departments: tally("departments", paperDepartments),
      academicYears: tally("academicYears", fromVariants("academicYear")),
      semesters: tally("semesters", fromVariants("semester")),
    };
  }, [applyFilters, queryResults]);

  const availableExamPeriods = useMemo(() => {
    const periods = papers
      .map((paper) => (paper.examPeriod || "").trim())
      .filter(Boolean);
    return sortExamPeriods(Array.from(new Set(periods)));
  }, [papers]);

  const availableAcademicYears = useMemo(() => {
    const years = papers
      .map((paper) => (paper.academicYear || "").trim())
      .filter(Boolean);
    return sortAcademicYears(Array.from(new Set(years)));
  }, [papers]);

  const availableSemesters = useMemo(() => {
    const semesters = papers
      .map((paper) => (paper.semester || "").trim())
      .filter(Boolean);
    return sortSemesters(Array.from(new Set(semesters)));
  }, [papers]);

  // Course view: ?course=ICT3301, a searched course code (old codes too), or a search that names
  // exactly one course ("human computer interaction"). Department-name searches are filters.
  const searchText = query.trim();
  const searchIsDepartment = getDepartmentFilterFromQuery(searchText).length > 0;
  const matchingCourses = useMemo(
    () => (courseParam || !searchText || searchIsDepartment || normalizeCourseCode(searchText) ? [] : findCourses(searchText)),
    [courseParam, searchText, searchIsDepartment]
  );
  const activeCourse = useMemo(() => {
    if (courseParam) return courseView(papers, courseParam);
    if (!searchText || searchIsDepartment) return null;
    if (normalizeCourseCode(searchText)) return courseView(papers, searchText);
    return matchingCourses.length === 1 ? courseView(papers, matchingCourses[0].code) : null;
  }, [papers, courseParam, searchText, searchIsDepartment, matchingCourses]);

  // Course lists: one department and one year selected (and no search), grouped by semester.
  const courseDepartment = selectedDepartments.length === 1 ? selectedDepartments[0] : null;
  const courseYear = selectedAcademicYears.length === 1 ? numberFrom(selectedAcademicYears[0]) : null;
  const courseSemesters = useMemo(
    () => (selectedSemesters.length === 1 ? [numberFrom(selectedSemesters[0])].filter(Boolean) : [1, 2]),
    [selectedSemesters]
  );
  const semesterBlocks = useMemo(() => {
    if (activeCourse || searchText || !courseDepartment || !courseYear) return null;
    return courseSemesters.map((semester) => ({
      semester,
      courses: coursesFor(papers, courseDepartment, courseYear, semester).map((course) => ({
        ...course,
        count: papersForCourse(papers, course.code).length,
      })),
      others: otherPaperGroups(papers, courseDepartment, courseYear, semester),
    }));
  }, [papers, activeCourse, searchText, courseDepartment, courseYear, courseSemesters]);
  const courseCount = semesterBlocks?.reduce((sum, block) => sum + block.courses.length, 0) || 0;

  const openCourse = useCallback((code) => {
    setOpenedCourse(true);
    window.history.pushState(null, "", courseHref(code));
    window.scrollTo({ top: 0 });
  }, []);
  const closeCourse = useCallback(() => {
    if (openedCourse) {
      setOpenedCourse(false);
      window.history.back();
    } else {
      router.push("/search");
    }
  }, [openedCourse, router]);

  const totalResults = displayResults.length;
  const pageSize = viewMode === "list" ? LIST_PAGE_SIZE : COMPACT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayResults.slice(start, start + pageSize);
  }, [displayResults, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    viewMode,
    sortBy,
    selectedDepartments,
    selectedExamPeriods,
    selectedAcademicYears,
    selectedSemesters,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [
    currentPage,
    selectedDepartments,
    selectedExamPeriods,
    selectedAcademicYears,
    selectedSemesters,
    query,
    yearsParam,
    viewMode,
    sortBy,
  ]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const hasActiveFilters =
    Boolean(query.trim()) ||
    selectedDepartments.length > 0 ||
    selectedExamPeriods.length > 0 ||
    selectedAcademicYears.length > 0 ||
    selectedSemesters.length > 0;

  const selectedFilterCount =
    selectedDepartments.length +
    selectedExamPeriods.length +
    selectedAcademicYears.length +
    selectedSemesters.length;

  const handleResetFilters = () => {
    setSelectedDepartments([]);
    setSelectedExamPeriods([]);
    setSelectedAcademicYears([]);
    setSelectedSemesters([]);
    setCurrentPage(1);
    router.replace("/search");
  };

  const clearQuery = () => {
    router.replace(yearsParam ? `/search?years=${encodeURIComponent(yearsParam)}` : "/search");
  };

  const activeChips = [
    ...(query.trim()
      ? [{ key: "q", group: "Search", label: `“${query.trim()}”`, onRemove: clearQuery }]
      : []),
    ...selectedDepartments.map((value) => ({
      key: `d-${value}`,
      group: "Department",
      label: value,
      onRemove: () => setSelectedDepartments((prev) => prev.filter((v) => v !== value)),
    })),
    ...selectedExamPeriods.map((value) => ({
      key: `p-${value}`,
      group: "Exam period",
      label: value,
      onRemove: () => setSelectedExamPeriods((prev) => prev.filter((v) => v !== value)),
    })),
    ...selectedAcademicYears.map((value) => ({
      key: `y-${value}`,
      group: "Year",
      label: value,
      onRemove: () => setSelectedAcademicYears((prev) => prev.filter((v) => v !== value)),
    })),
    ...selectedSemesters.map((value) => ({
      key: `s-${value}`,
      group: "Semester",
      label: value,
      onRemove: () => setSelectedSemesters((prev) => prev.filter((v) => v !== value)),
    })),
  ];

  const rangeStart = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalResults);

  if (activeCourse) {
    const backLabel =
      openedCourse && courseDepartment && courseYear
        ? `${courseDepartment} · Year ${courseYear}`
        : "Past Papers";
    return (
      <CourseView
        view={activeCourse}
        loading={loading}
        backLabel={backLabel}
        onBack={courseParam ? closeCourse : null}
      />
    );
  }

  return (
    <section className="search-page" id="search-page">
      <div className="page-head" ref={resultsTopRef}>
        <div className="container page-head-inner">
          <div>
            <h1 className="text-headline-lg">
              {query ? (
                <>Results for &ldquo;{query}&rdquo;</>
              ) : (
                "Papers"
              )}
            </h1>
            <p className="page-head-meta">
              {loading ? (
                "Loading the archive…"
              ) : semesterBlocks ? (
                <>
                  <strong>{courseCount}</strong> course{courseCount === 1 ? "" : "s"} in{" "}
                  {courseDepartment} · Year {courseYear}
                </>
              ) : (
                <>
                  <strong>{totalResults.toLocaleString()}</strong> past paper
                  {totalResults === 1 ? "" : "s"}
                  {selectedFilterCount > 0 ? " match your filters" : " in the archive"}
                </>
              )}
            </p>
          </div>
          <SearchBar variant="inline" defaultValue={query} />
        </div>
      </div>

      <div className="container search-layout">
        <FilterSidebar
          selectedDepartments={selectedDepartments}
          selectedExamPeriods={selectedExamPeriods}
          selectedAcademicYears={selectedAcademicYears}
          selectedSemesters={selectedSemesters}
          onDepartmentChange={setSelectedDepartments}
          onExamPeriodChange={setSelectedExamPeriods}
          onAcademicYearChange={setSelectedAcademicYears}
          onSemesterChange={setSelectedSemesters}
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          examPeriodOptions={availableExamPeriods}
          academicYearOptions={
            availableAcademicYears.length > 0 ? availableAcademicYears : undefined
          }
          semesterOptions={
            availableSemesters.length > 0 ? availableSemesters : undefined
          }
          counts={loading ? null : facetCounts}
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          resultCount={totalResults}
        />

        <div>
          <div className="results-toolbar">
            <p className="results-toolbar-count" aria-live="polite">
              {loading ? (
                "Loading…"
              ) : semesterBlocks ? (
                "Pick a course to see all of its past papers"
              ) : totalResults > 0 ? (
                <>
                  Showing <strong>{rangeStart}–{rangeEnd}</strong> of{" "}
                  <strong>{totalResults}</strong>
                </>
              ) : (
                "No matches"
              )}
            </p>
            <div className="results-toolbar-controls">
              <button
                type="button"
                className="btn btn-secondary btn-sm filter-open-btn"
                onClick={() => setFiltersOpen(true)}
                aria-controls="filter-sidebar"
                aria-expanded={filtersOpen}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  tune
                </span>
                Filters
                {selectedFilterCount > 0 && (
                  <span className="filter-badge">{selectedFilterCount}</span>
                )}
              </button>
              {!semesterBlocks && (
              <>
              <label className="sort-select">
                <span className="material-symbols-outlined" aria-hidden="true">
                  sort
                </span>
                <span className="sr-only">Sort papers</span>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  {PAPER_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined sort-select-chevron" aria-hidden="true">
                  expand_more
                </span>
              </label>
              <div className="view-toggle" id="view-toggle" role="group" aria-label="Layout">
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === "compact" ? "active" : ""}`}
                  onClick={() => setViewMode("compact")}
                  aria-pressed={viewMode === "compact"}
                  title="Card view"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    grid_view
                  </span>
                  <span className="view-toggle-label">Cards</span>
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  aria-pressed={viewMode === "list"}
                  title="List view"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    view_agenda
                  </span>
                  <span className="view-toggle-label">List</span>
                </button>
              </div>
              </>
              )}
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="active-filters" aria-label="Active filters">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="active-filter"
                  onClick={chip.onRemove}
                  aria-label={`Remove ${chip.group}: ${chip.label}`}
                >
                  <span className="active-filter-group">{chip.group}:</span>
                  {chip.label}
                  <span className="material-symbols-outlined" aria-hidden="true">
                    close
                  </span>
                </button>
              ))}
              {activeChips.length > 1 && (
                <button type="button" className="active-filters-clear" onClick={handleResetFilters}>
                  Clear all
                </button>
              )}
            </div>
          )}

          {!loading && loadError && (
            <div className="notice" role="status">
              <span className="material-symbols-outlined" aria-hidden="true">
                cloud_off
              </span>
              <span>
                We couldn&rsquo;t reach the paper archive. Refresh the page to try
                again, or contact ARICT through the Contact page.
              </span>
            </div>
          )}

          {!loading && matchingCourses.length > 1 && (
            <section className="matching-courses" aria-labelledby="matching-courses-heading">
              <h2 className="matching-courses-title" id="matching-courses-heading">
                Matching courses
              </h2>
              <ul className="course-index">
                {matchingCourses.slice(0, 8).map((course) => (
                  <CourseRow
                    key={course.code}
                    code={course.code}
                    title={course.title}
                    note={`Year ${course.year} · ${course.semesters.map(semesterLabel).join(" and ")}`}
                    count={papersForCourse(papers, course.code).length}
                    href={courseHref(course.code)}
                    onOpen={openCourse}
                  />
                ))}
              </ul>
              {matchingCourses.length > 8 && (
                <p className="matching-courses-more">
                  {matchingCourses.length - 8} more courses match. Add more of the course name or
                  code to narrow it down.
                </p>
              )}
            </section>
          )}

          {loading ? (
            <ResultsSkeleton viewMode={semesterBlocks ? "list" : viewMode} />
          ) : semesterBlocks ? (
            <div className="semester-blocks">
              {semesterBlocks.map((block) => (
                <SemesterCourses key={block.semester} {...block} onOpenCourse={openCourse} />
              ))}
            </div>
          ) : displayResults.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                <span className="material-symbols-outlined">search_off</span>
              </span>
              <h2>No papers match</h2>
              <p>
                {hasActiveFilters
                  ? "Try fewer filters or a shorter search, such as just the course code. If the paper isn't in the archive yet, request it."
                  : "The archive is empty right now. Request a paper and ARICT will add it."}
              </p>
              <div className="empty-state-actions">
                {hasActiveFilters && (
                  <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      restart_alt
                    </span>
                    Reset filters
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={openRequestPaper}>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    note_add
                  </span>
                  Request this paper
                </button>
              </div>
            </div>
          ) : viewMode === "list" ? (
            <div className="results-list">
              {paginatedResults.map((paper) => (
                <PaperListItem key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="results-grid results-grid-compact">
              {paginatedResults.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  compact={viewMode === "compact"}
                />
              ))}
            </div>
          )}

          {!loading && !semesterBlocks && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default function SearchPage({ initialPapers = null }) {
  return <SearchResultsContent initialPapers={initialPapers} />;
}
