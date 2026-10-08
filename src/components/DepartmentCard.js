import Link from "next/link";

// One row of the department ledger on the home page.
export default function DepartmentCard({ department, loading = false }) {
  const formatStat = (value) =>
    loading ? "…" : Number.isFinite(value) ? value.toLocaleString() : "—";

  return (
    <li>
      <Link
        href={`/search?q=${encodeURIComponent(department.name)}`}
        className="dept-row"
        id={`dept-card-${department.id}`}
      >
        <span className="dept-row-icon" aria-hidden="true">
          <span className="material-symbols-outlined">{department.icon}</span>
        </span>
        <span>
          <span className="dept-row-name">{department.name}</span>
          <span className="dept-row-desc">
            {department.description || "Resources curated for this department."}
          </span>
        </span>
        <span className="dept-row-stat">
          <strong>{formatStat(department.paperCount)}</strong>
          papers
        </span>
        <span className="dept-row-stat dept-row-stat--subjects">
          <strong>{formatStat(department.courseCount)}</strong>
          subjects
        </span>
        <span className="material-symbols-outlined dept-row-arrow" aria-hidden="true">
          arrow_forward
        </span>
      </Link>
    </li>
  );
}
