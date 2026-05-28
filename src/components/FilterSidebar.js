"use client";

import { departments } from "@/data/departments";

const defaultDepartmentOptions = departments.map((dept) => ({
  label: dept.name,
  value: dept.name,
}));

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
}) {
  const handleDeptToggle = (value) => {
    if (selectedDepartments.includes(value)) {
      onDepartmentChange(selectedDepartments.filter((d) => d !== value));
    } else {
      onDepartmentChange([...selectedDepartments, value]);
    }
  };

  const handleExamPeriodToggle = (value) => {
    if (selectedExamPeriods.includes(value)) {
      onExamPeriodChange(selectedExamPeriods.filter((period) => period !== value));
    } else {
      onExamPeriodChange([...selectedExamPeriods, value]);
    }
  };

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
    <aside className="filter-sidebar" id="filter-sidebar">
      <div className="filter-sidebar-header">
        <h2 className="filter-sidebar-title">Filters</h2>
        <button
          type="button"
          className="filter-reset-btn"
          onClick={onReset}
          disabled={!hasActiveFilters}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            filter_alt_off
          </span>
          Reset filters
        </button>
      </div>

      <div className="filter-group">
        <div className="filter-group-header">
          <h3>Department</h3>
          <span
            className="material-symbols-outlined filter-icon"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_balance
          </span>
        </div>
        <div className="filter-options">
          {departmentOptions.map((dept) => (
            <label key={dept.value} className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={selectedDepartments.includes(dept.value)}
                onChange={() => handleDeptToggle(dept.value)}
              />
              {dept.label}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-group-header">
          <h3>Examination period</h3>
          <span className="material-symbols-outlined filter-icon">calendar_month</span>
        </div>
        <div className="filter-options">
          {examPeriodOptions.length > 0 ? (
            examPeriodOptions.map((period) => (
              <label key={period} className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={selectedExamPeriods.includes(period)}
                  onChange={() => handleExamPeriodToggle(period)}
                />
                {period}
              </label>
            ))
          ) : (
            <p className="text-body-md" style={{ color: "var(--color-secondary)" }}>
              No examination periods yet.
            </p>
          )}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-group-header">
          <h3>Academic year</h3>
          <span className="material-symbols-outlined filter-icon">school</span>
        </div>
        <div className="filter-options">
          {academicYearOptions.map((year) => (
            <label key={year} className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={selectedAcademicYears.includes(year)}
                onChange={() => handleAcademicYearToggle(year)}
              />
              {year}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-group-header">
          <h3>Semester</h3>
          <span className="material-symbols-outlined filter-icon">event</span>
        </div>
        <div className="filter-options">
          {semesterOptions.map((semester) => (
            <label key={semester} className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={selectedSemesters.includes(semester)}
                onChange={() => handleSemesterToggle(semester)}
              />
              {semester}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
