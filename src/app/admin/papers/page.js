"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import PapersTable from "@/components/admin/PapersTable";
import { DEPARTMENT_NAMES } from "@/lib/constants";
import {
  deletePaper,
  fetchAllPapers,
  filterAdminPapers,
  sortPapersByDate,
} from "@/lib/papers";

export default function ManagePapersPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPapers();
      setPapers(sortPapersByDate(data));
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to load papers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const filteredPapers = useMemo(
    () => filterAdminPapers(papers, { query, department }),
    [papers, query, department]
  );

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deletePaper(
        pendingDelete.departmentFull || pendingDelete.department,
        pendingDelete.docId
      );
      setPapers((prev) => prev.filter((paper) => paper.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err?.message || "Failed to delete paper.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="text-headline-lg">Manage Papers</h1>
          <p className="text-body-md">
            Search, edit, or delete papers across all departments.
          </p>
        </div>
        <Link href="/admin/add-paper" className="btn btn-primary">
          Add Paper
        </Link>
      </div>

      {error ? (
        <div className="form-status form-status--error">{error}</div>
      ) : null}

      <div className="card admin-filters">
        <div className="admin-filters-grid">
          <div className="form-field">
            <label htmlFor="admin-search">Search</label>
            <input
              id="admin-search"
              className="input-field"
              placeholder="Search by code, title, instructor..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="admin-department">Department</label>
            <select
              id="admin-department"
              className="input-field"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="">All departments</option>
              {DEPARTMENT_NAMES.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="admin-results-count text-body-md">
          Showing {filteredPapers.length} paper{filteredPapers.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="card admin-panel">
        <PapersTable
          papers={filteredPapers}
          loading={loading}
          onDelete={setPendingDelete}
        />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete paper?"
        message={
          pendingDelete
            ? `Delete ${pendingDelete.courseCode} — ${pendingDelete.title}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </section>
  );
}