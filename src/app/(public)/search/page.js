"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import PaperCard from "@/components/PaperCard";
import PaperListItem from "@/components/PaperListItem";
import Pagination from "@/components/Pagination";
import { filterPapers, papers as localPapers } from "@/data/papers";
import { fetchAllPapers } from "@/lib/papers";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const yearsParam = searchParams.get("years") || "";
  const initialExamPeriods = yearsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const [viewMode, setViewMode] = useState("compact"); // compact, list
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedExamPeriods, setSelectedExamPeriods] = useState(initialExamPeriods);
  const [selectedAcademicYears, setSelectedAcademicYears] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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

  const displayResults = useMemo(() => {
    let filtered = filterPapers(papers, query);

    if (selectedDepartments.length > 0) {
      filtered = filtered.filter((p) =>
        selectedDepartments.includes(p.departmentFull || p.department)
      );
    }

    if (selectedExamPeriods.length > 0) {
      filtered = filtered.filter((p) => selectedExamPeriods.includes(p.examPeriod));
    }

    if (selectedAcademicYears.length > 0) {
      filtered = filtered.filter((p) =>
        selectedAcademicYears.includes(p.academicYear)
      );
    }

    if (selectedSemesters.length > 0) {
      filtered = filtered.filter((p) => selectedSemesters.includes(p.semester));
    }

    return filtered;
  }, [
    papers,
    query,
    selectedDepartments,
    selectedExamPeriods,
    selectedAcademicYears,
    selectedSemesters,
  ]);

  const availableExamPeriods = useMemo(() => {
    const periods = papers
      .map((paper) => (paper.examPeriod || "").trim())
      .filter(Boolean);
    return Array.from(new Set(periods)).sort((a, b) => b.localeCompare(a));
  }, [papers]);

  const availableAcademicYears = useMemo(() => {
    const years = papers
      .map((paper) => (paper.academicYear || "").trim())
      .filter(Boolean);
    return Array.from(new Set(years));
  }, [papers]);

  const availableSemesters = useMemo(() => {
    const semesters = papers
      .map((paper) => (paper.semester || "").trim())
      .filter(Boolean);
    return Array.from(new Set(semesters));
  }, [papers]);

  const totalResults = displayResults.length;

  return (
    <section className="search-page" id="search-page">
      <div className="container">
        {/* Header */}
        <div className="search-page-header">
          <div>
            <h1 className="text-headline-lg">{query ? "Search Results" : "Papers"}</h1>
            <p className="text-body-md" style={{ color: "var(--color-secondary)" }}>
              Showing {totalResults} past papers
              {query && (
                <>
                  {" "}for{" "}
                  <strong style={{ color: "var(--color-on-surface)" }}>
                    &ldquo;{query}&rdquo;
                  </strong>
                </>
              )}
            </p>
          </div>
          <SearchBar variant="inline" defaultValue={query} />
        </div>

        <hr className="divider" />

        {/* View Toggle + Layout */}
        <div className="search-page-layout">
          <FilterSidebar
            selectedDepartments={selectedDepartments}
            selectedExamPeriods={selectedExamPeriods}
            selectedAcademicYears={selectedAcademicYears}
            selectedSemesters={selectedSemesters}
            onDepartmentChange={setSelectedDepartments}
            onExamPeriodChange={setSelectedExamPeriods}
            onAcademicYearChange={setSelectedAcademicYears}
            onSemesterChange={setSelectedSemesters}
            examPeriodOptions={availableExamPeriods}
            academicYearOptions={
              availableAcademicYears.length > 0 ? availableAcademicYears : undefined
            }
            semesterOptions={
              availableSemesters.length > 0 ? availableSemesters : undefined
            }
          />

          <div>
            {/* View Toggle */}
            <div className="view-toggle" id="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === "compact" ? "active" : ""}`}
                onClick={() => setViewMode("compact")}
                aria-label="Compact view"
                title="Compact view"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  view_module
                </span>
              </button>
              <button
                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                aria-label="List view"
                title="List view"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  view_list
                </span>
              </button>
            </div>

            {/* Results */}
            {loading ? (
              <div className="results-empty">Loading papers...</div>
            ) : displayResults.length === 0 ? (
              <div className="results-empty">
                {loadError ? "Showing local sample data." : "No papers found."}
              </div>
            ) : viewMode === "list" ? (
              <div className="results-list">
                {displayResults.map((paper) => (
                  <PaperListItem key={paper.id} paper={paper} />
                ))}
              </div>
            ) : (
              <div className="results-grid results-grid-compact">
                {displayResults.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    compact={viewMode === "compact"}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={3}
              onPageChange={setCurrentPage}
            />
          </div>
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
          <div className="container">
            <h1 className="text-headline-lg">Loading...</h1>
          </div>
        </section>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
