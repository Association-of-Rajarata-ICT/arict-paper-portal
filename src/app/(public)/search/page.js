"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import PaperCard from "@/components/PaperCard";
import PaperListItem from "@/components/PaperListItem";
import Pagination from "@/components/Pagination";
import { departments } from "@/data/departments";
import { filterPapers, papers as localPapers } from "@/data/papers";
import {
  fetchAllPapers,
  sortAcademicYears,
  sortExamPeriods,
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

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const yearsParam = searchParams.get("years") || "";
  const initialExamPeriods = yearsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const initialDepartments = getDepartmentFilterFromQuery(query);

  const [viewMode, setViewMode] = useState("compact"); // compact, list
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartments, setSelectedDepartments] = useState(initialDepartments);
  const [selectedExamPeriods, setSelectedExamPeriods] = useState(initialExamPeriods);
  const [selectedAcademicYears, setSelectedAcademicYears] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsTopRef = useRef(null);
  const skipScrollRef = useRef(true);

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
          setPapers(localPapers);
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
  }, []);

  const queryResults = useMemo(() => filterPapers(papers, query), [papers, query]);

  // Applies every selected filter group except `skip`, so facet counts show
  // how many papers each option would add given the other selections.
  const applyFilters = useCallback(
    (list, skip = null) =>
      list.filter((p) => {
        if (
          skip !== "departments" &&
          selectedDepartments.length > 0 &&
          !selectedDepartments.includes(p.departmentFull || p.department)
        ) {
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
          selectedAcademicYears.length > 0 &&
          !selectedAcademicYears.includes(p.academicYear)
        ) {
          return false;
        }
        if (
          skip !== "semesters" &&
          selectedSemesters.length > 0 &&
          !selectedSemesters.includes(p.semester)
        ) {
          return false;
        }
        return true;
      }),
    [selectedDepartments, selectedExamPeriods, selectedAcademicYears, selectedSemesters]
  );

  const displayResults = useMemo(
    () => applyFilters(queryResults),
    [applyFilters, queryResults]
  );

  const facetCounts = useMemo(() => {
    const tally = (skip, getValue) => {
      const counts = {};
      applyFilters(queryResults, skip).forEach((paper) => {
        const value = (getValue(paper) || "").trim();
        if (value) counts[value] = (counts[value] || 0) + 1;
      });
      return counts;
    };
    return {
      departments: tally("departments", (p) => p.departmentFull || p.department),
      academicYears: tally("academicYears", (p) => p.academicYear),
      semesters: tally("semesters", (p) => p.semester),
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
                We couldn&rsquo;t reach the paper archive, so you&rsquo;re seeing sample
                papers. Refresh the page to try again.
              </span>
            </div>
          )}

          {loading ? (
            <ResultsSkeleton viewMode={viewMode} />
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

          {!loading && totalPages > 1 && (
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <section className="search-page">
          <div className="page-head">
            <div className="container page-head-inner">
              <h1 className="text-headline-lg">Papers</h1>
            </div>
          </div>
        </section>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
