"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import PaperCard from "@/components/PaperCard";
import PaperListItem from "@/components/PaperListItem";
import Pagination from "@/components/Pagination";
import { filterPapers, papers as localPapers } from "@/data/papers";
import { departments } from "@/data/departments";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const departmentCollections = departments.map((dept) => dept.name);

const getInstructorValue = (data = {}) => {
  const value =
    data.instructor ??
    data.Instructor ??
    data["instructor name"] ??
    data["Instructor Name"] ??
    data.lecturer ??
    data.Lecturer ??
    data["lecturer name"] ??
    data["Lecturer Name"] ??
    data.instructor_name ??
    data.lecturer_name ??
    "";

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  const matchingKey = Object.keys(data).find((key) => {
    const normalized = key.trim().toLowerCase();
    return (
      normalized === "instructor" ||
      normalized === "instructor name" ||
      normalized === "lecturer" ||
      normalized === "lecturer name"
    );
  });

  if (matchingKey) {
    const fallbackValue = data[matchingKey];
    return typeof fallbackValue === "string" ? fallbackValue.trim() : "";
  }

  return "";
};

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [viewMode, setViewMode] = useState("grid"); // grid, compact, list
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPapers = async () => {
      try {
        const snapshots = await Promise.all(
          departmentCollections.map((dept) => getDocs(collection(db, dept)))
        );

        const data = snapshots.flatMap((snapshot, index) => {
          const collectionName = departmentCollections[index];
          return snapshot.docs.map((doc) => {
            const docData = doc.data();
            const subjectCode =
              docData["subject code"] || docData.subjectCode || docData.courseCode || "";
            const subjectName =
              docData["subject name"] || docData.subjectName || docData.title || "";
            const instructor = getInstructorValue(docData);
            const driveLink = docData["drive link"] || docData.driveLink || "";
            const year = docData.year || "";

            return {
              id: `${collectionName}-${doc.id}`,
              docId: doc.id,
              courseCode: subjectCode,
              title: subjectName,
              description: instructor ? `Instructor: ${instructor}` : "",
              year,
              department: collectionName,
              departmentFull: collectionName,
              semester: docData.semester || "",
              duration: docData.duration || "",
              fileSize: docData.fileSize || "",
              difficulty: docData.difficulty || "",
              type: docData.type || null,
              isRestricted: Boolean(docData.isRestricted),
              driveLink,
              instructor,
            };
          });
        });

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

    if (selectedYears.length > 0) {
      filtered = filtered.filter((p) => selectedYears.includes(p.year));
    }

    return filtered;
  }, [papers, query, selectedDepartments, selectedYears]);

  const availableYears = useMemo(() => {
    const years = papers
      .map((paper) => (paper.year || "").trim())
      .filter(Boolean);
    return Array.from(new Set(years));
  }, [papers]);

  const totalResults = displayResults.length;

  return (
    <section className="search-page" id="search-page">
      <div className="container">
        {/* Header */}
        <div className="search-page-header">
          <div>
            <h1 className="text-headline-lg">{query ? "Search Results" : "Courses"}</h1>
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
            selectedYears={selectedYears}
            onDepartmentChange={setSelectedDepartments}
            onYearChange={setSelectedYears}
            yearOptions={availableYears.length > 0 ? availableYears : undefined}
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
