"use client";

import Link from "next/link";

function formatDate(createdAt) {
  if (!createdAt?.seconds) return "—";
  return new Date(createdAt.seconds * 1000).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getEditHref(paper) {
  const department = encodeURIComponent(paper.departmentFull || paper.department);
  const docId = encodeURIComponent(paper.docId);
  return `/admin/papers/${department}/${docId}`;
}

function getPublicHref(paper) {
  const docId = encodeURIComponent(paper.docId);
  const department = encodeURIComponent(paper.departmentFull || paper.department || "");
  return `/paper/${docId}?dept=${department}`;
}

export default function PapersTable({
  papers,
  loading,
  onDelete,
  compact = false,
  showDelete = true,
}) {
  if (loading) {
    return <div className="admin-empty-state">Loading papers...</div>;
  }

  if (papers.length === 0) {
    return (
      <div className="admin-empty-state">
        No papers found. Try adjusting your search or add a new paper.
      </div>
    );
  }

  return (
    <div className={`admin-table-wrap ${compact ? "admin-table-wrap--compact" : ""}`}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Subject</th>
            {!compact && <th>Department</th>}
            <th>Year</th>
            {!compact && <th>Instructor</th>}
            {!compact && <th>Added</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {papers.map((paper) => (
            <tr key={paper.id}>
              <td className="admin-table-code">{paper.courseCode || "—"}</td>
              <td className="admin-table-title">{paper.title || "—"}</td>
              {!compact && (
                <td>{paper.departmentFull || paper.department || "—"}</td>
              )}
              <td>{paper.year || "—"}</td>
              {!compact && <td>{paper.instructor || "—"}</td>}
              {!compact && <td>{formatDate(paper.createdAt)}</td>}
              <td>
                <div className="admin-table-actions">
                  <Link
                    href={getPublicHref(paper)}
                    className="btn btn-secondary admin-table-btn"
                    target="_blank"
                  >
                    View
                  </Link>
                  <Link
                    href={getEditHref(paper)}
                    className="btn btn-secondary admin-table-btn"
                  >
                    Edit
                  </Link>
                  {showDelete ? (
                    <button
                      type="button"
                      className="btn btn-primary admin-table-btn admin-table-btn--danger"
                      onClick={() => onDelete(paper)}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
