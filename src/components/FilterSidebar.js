"use client";

import { departments } from "@/data/departments";

const defaultDepartmentOptions = departments.map((dept) => ({
  label: dept.name,
  value: dept.name,
}));

const defaultYearOptions = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];

export default function FilterSidebar({
  selectedDepartments = [],
  selectedYears = [],
  onDepartmentChange,
  onYearChange,
  departmentOptions = defaultDepartmentOptions,
  yearOptions = defaultYearOptions,
}) {
  const handleDeptToggle = (value) => {
    if (selectedDepartments.includes(value)) {
      onDepartmentChange(selectedDepartments.filter((d) => d !== value));
    } else {
      onDepartmentChange([...selectedDepartments, value]);
    }
  };

  const handleYearToggle = (value) => {
    if (selectedYears.includes(value)) {
      onYearChange(selectedYears.filter((y) => y !== value));
    } else {
      onYearChange([...selectedYears, value]);
    }
  };

  return (
    <aside className="filter-sidebar" id="filter-sidebar">
      {/* Department Filter */}
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

      {/* Academic Year Filter */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h3>Examination period</h3>
          <span
            className="material-symbols-outlined filter-icon"
          >
            calendar_month
          </span>
        </div>
        <div className="filter-options">
          {yearOptions.map((year) => (
            <label key={year} className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={selectedYears.includes(year)}
                onChange={() => handleYearToggle(year)}
              />
              {year}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
