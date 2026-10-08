"use client";

import { useEffect } from "react";
import { departments } from "@/data/departments";
import { sortAcademicYears, sortSemesters } from "@/lib/papers";
// import { sortExamPeriods } from "@/lib/papers"; // restore with examination period filter

const defaultDepartmentOptions = departments.map((dept) => ({
  label: dept.name,
  value: dept.name,
}));

function FilterOption({ label, checked, count, onToggle }) {
  const hasCount = typeof count === "number";
  const classNames = ["filter-option"];
  if (checked) classNames.push("is-checked");
  if (hasCount && count === 0 && !checked) classNames.push("is-empty");

  return (
    <label className={classNames.join(" ")}>
      <input type="checkbox" className="tickbox" checked={checked} onChange={onToggle} />
      <span className="filter-option-label">{label}</span>
      {hasCount && (
        <span className="filter-option-count" aria-label={`${count} papers`}>
          {count}
        </span>
      )}
    </label>
  );
}

export default function FilterSidebar({
  selectedDepartments = [],
  selectedExamPeriods = [],
  selectedAcademicYears = [],
  selectedSemesters = [],
  onDepartmentChange,
  onExamPeriodChange,
  onAcademicYearChange,
  onSemesterChange,
  departmentOptions = defaultDepartmentOptions,
  examPeriodOptions = [],
  academicYearOptions = ["Year 1", "Year 2", "Year 3", "Year 4"],
  semesterOptions = ["Semester 1", "Semester 2"],
  onReset,
  hasActiveFilters = false,
  counts = null,
  open = false,
  onClose,
  resultCount = 0,
}) {
  const sortedAcademicYearOptions = sortAcademicYears(academicYearOptions);
  const sortedSemesterOptions = sortSemesters(semesterOptions);
  // const sortedExamPeriodOptions = sortExamPeriods(examPeriodOptions);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleDeptToggle = (value) => {
    if (selectedDepartments.includes(value)) {
      onDepartmentChange(selectedDepartments.filter((d) => d !== value));
    } else {
      onDepartmentChange([...selectedDepartments, value]);
    }
  };

  // Temporarily hidden — uncomment to restore examination period filter
  // const handleExamPeriodToggle = (value) => {
  //   if (selectedExamPeriods.includes(value)) {
  //     onExamPeriodChange(selectedExamPeriods.filter((period) => period !== value));
  //   } else {
  //     onExamPeriodChange([...selectedExamPeriods, value]);
  //   }
  // };

  const handleAcademicYearToggle = (value) => {
    if (selectedAcademicYears.includes(value)) {
      onAcademicYearChange(selectedAcademicYears.filter((year) => year !== value));
    } else {
      onAcademicYearChange([...selectedAcademicYears, value]);
    }
  };

  const handleSemesterToggle = (value) => {
    if (selectedSemesters.includes(value)) {
      onSemesterChange(selectedSemesters.filter((semester) => semester !== value));
    } else {
      onSemesterChange([...selectedSemesters, value]);
    }
  };

  return (
    <>
      <div
        className={`drawer-scrim filter-scrim ${open ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`filter-sidebar ${open ? "open" : ""}`}
        id="filter-sidebar"
        aria-label="Filters"
      >
        <div className="filter-sidebar-header">
          <h2 className="filter-sidebar-title">Filters</h2>
          <button
            type="button"
            className="filter-reset-btn"
            onClick={onReset}
            disabled={!hasActiveFilters}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              restart_alt
            </span>
            Reset all
          </button>
        </div>

        <div className="filter-sidebar-body">
          <fieldset className="filter-group">
            <legend className="filter-group-title">
              <span className="material-symbols-outlined" aria-hidden="true">
                account_balance
              </span>
              Department
            </legend>
            <div className="filter-options">
              {departmentOptions.map((dept) => (
                <FilterOption
                  key={dept.value}
                  label={dept.label}
                  checked={selectedDepartments.includes(dept.value)}
                  count={counts?.departments?.[dept.value] ?? (counts ? 0 : undefined)}
                  onToggle={() => handleDeptToggle(dept.value)}
                />
              ))}
            </div>
          </fieldset>

          {/* Temporarily hidden — uncomment to restore examination period filter
          <fieldset className="filter-group">
            <legend className="filter-group-title">
              <span className="material-symbols-outlined" aria-hidden="true">calendar_month</span>
              Examination period
            </legend>
            <div className="filter-options">
              {sortedExamPeriodOptions.length > 0 ? (
                sortedExamPeriodOptions.map((period) => (
                  <FilterOption
                    key={period}
                    label={period}
                    checked={selectedExamPeriods.includes(period)}
                    onToggle={() => handleExamPeriodToggle(period)}
                  />
                ))
              ) : (
                <p className="text-body-md">No examination periods yet.</p>
              )}
            </div>
          </fieldset>
          */}

          <fieldset className="filter-group">
            <legend className="filter-group-title">
              <span className="material-symbols-outlined" aria-hidden="true">
                school
              </span>
              Academic year
            </legend>
            <div className="filter-options">
              {sortedAcademicYearOptions.map((year) => (
                <FilterOption
                  key={year}
                  label={year}
                  checked={selectedAcademicYears.includes(year)}
                  count={counts?.academicYears?.[year] ?? (counts ? 0 : undefined)}
                  onToggle={() => handleAcademicYearToggle(year)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="filter-group">
            <legend className="filter-group-title">
              <span className="material-symbols-outlined" aria-hidden="true">
                event
              </span>
              Semester
            </legend>
            <div className="filter-options">
              {sortedSemesterOptions.map((semester) => (
                <FilterOption
                  key={semester}
                  label={semester}
                  checked={selectedSemesters.includes(semester)}
                  count={counts?.semesters?.[semester] ?? (counts ? 0 : undefined)}
                  onToggle={() => handleSemesterToggle(semester)}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div className="filter-sidebar-footer">
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onClose}>
            Show {resultCount} paper{resultCount === 1 ? "" : "s"}
          </button>
        </div>
      </aside>
    </>
  );
}
