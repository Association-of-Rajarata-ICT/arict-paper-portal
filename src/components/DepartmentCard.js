import Link from "next/link";

// One department tile on the home page.
export default function DepartmentCard({ department, loading = false }) {
  const formatStat = (value) =>
    loading ? "…" : Number.isFinite(value) ? value.toLocaleString() : "—";

  return (
    <li data-dept={department.id}>
      <Link
        href={`/search?q=${encodeURIComponent(department.name)}`}
        className="dept-tile"
        id={`dept-card-${department.id}`}
      >
        <span className="dept-icon" aria-hidden="true">
          <span className="material-symbols-outlined">{department.icon}</span>
        </span>
        <span className="dept-tile-name">{department.name}</span>
        <span className="dept-tile-desc">
          {department.description || "Resources curated for this department."}
        </span>
        <span className="dept-tile-stats">
          <span>
            <strong>{formatStat(department.paperCount)}</strong> papers
          </span>
          <span>
            <strong>{formatStat(department.courseCount)}</strong> subjects
          </span>
        </span>
      </Link>
    </li>
  );
}
