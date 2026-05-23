"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import PaperCard from "@/components/PaperCard";
import PaperListItem from "@/components/PaperListItem";
import Pagination from "@/components/Pagination";
import { searchPapers } from "@/data/papers";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "Computing";

  const [viewMode, setViewMode] = useState("grid"); // grid, compact, list
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartments, setSelectedDepartments] = useState(["Computing"]);
  const [selectedYears, setSelectedYears] = useState(["2023"]);

  const results = useMemo(() => {
    return searchPapers(query, {
      departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
      years: selectedYears.length > 0 ? selectedYears : undefined,
    });
  }, [query, selectedDepartments, selectedYears]);

  // If filters produce no results, show all matching the query
  const displayResults = results.length > 0 ? results : searchPapers(query);
  const totalResults = displayResults.length;

  return (
    <section className="search-page" id="search-page">
      <div className="container">
        {/* Header */}
        <div className="search-page-header">
          <div>
            <h1 className="text-headline-lg">Search Results</h1>
            <p className="text-body-md" style={{ color: "var(--color-secondary)" }}>
              Showing {totalResults} past papers for{" "}
              <strong style={{ color: "var(--color-on-surface)" }}>
                &ldquo;{query}&rdquo;
              </strong>
            </p>
          </div>
          <SearchBar variant="inline" defaultValue={query} />
        </div>

        <hr className="divider" />

        {/* View Toggle + Layout */}
        <div className="search-page-layout">
          <FilterSidebar
            selectedDepartments={selectedDepartments}
            selectedYears={selectedYears}
            onDepartmentChange={setSelectedDepartments}
            onYearChange={setSelectedYears}
          />

          <div>
            {/* View Toggle */}
            <div className="view-toggle" id="view-toggle">
              <button
                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                title="Grid view"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  grid_view
                </span>
              </button>
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
            {viewMode === "list" ? (
              <div className="results-list">
                {displayResults.map((paper) => (
                  <PaperListItem key={paper.id} paper={paper} />
                ))}
              </div>
            ) : (
              <div
                className="results-grid"
                style={
                  viewMode === "compact"
                    ? { gridTemplateColumns: "repeat(3, 1fr)" }
                    : undefined
                }
              >
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
