"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/admin/StatsCard";
import PapersTable from "@/components/admin/PapersTable";
import {
  fetchAllPapers,
  getDepartmentStats,
  sortPapersByDate,
} from "@/lib/papers";

export default function AdminDashboardPage() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await fetchAllPapers();
        if (isMounted) {
          setPapers(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load dashboard data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const departmentStats = useMemo(() => getDepartmentStats(papers), [papers]);
  const recentPapers = useMemo(
    () => sortPapersByDate(papers).slice(0, 8),
    [papers]
  );
  const topDepartment = useMemo(() => {
    if (departmentStats.length === 0) return null;
    return [...departmentStats].sort((a, b) => b.count - a.count)[0];
  }, [departmentStats]);

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="text-headline-lg">Dashboard</h1>
          <p className="text-body-md">Overview of papers across all departments.</p>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/add-paper" className="btn btn-primary">
            Add Paper
          </Link>
          <Link href="/admin/papers" className="btn btn-secondary">
            Manage Papers
          </Link>
        </div>
      </div>

      {error ? (
        <div className="form-status form-status--error">{error}</div>
      ) : null}

      <div className="admin-stats-grid">
        <StatsCard
          icon="description"
          label="Total Papers"
          value={loading ? "—" : papers.length.toLocaleString()}
        />
        <StatsCard
          icon="domain"
          label="Departments"
          value="5"
          hint="Active collections"
        />
        <StatsCard
          icon="trending_up"
          label="Largest Department"
          value={loading ? "—" : topDepartment?.name || "—"}
          hint={
            topDepartment
              ? `${topDepartment.count} paper${topDepartment.count === 1 ? "" : "s"}`
              : undefined
          }
        />
        <StatsCard
          icon="add_circle"
          label="Quick Action"
          value="Add Paper"
          hint="Upload a new past paper"
        />
      </div>

      <div className="admin-panel-grid">
        <div className="card admin-panel">
          <div className="admin-panel-header">
            <h2 className="text-headline-sm">Papers by Department</h2>
          </div>
          <div className="admin-dept-stats">
            {departmentStats.map((dept) => (
              <div key={dept.name} className="admin-dept-stat-row">
                <span>{dept.name}</span>
                <strong>{loading ? "—" : dept.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="card admin-panel admin-panel--coming-soon">
          <div className="admin-panel-header">
            <h2 className="text-headline-sm">Coming Soon</h2>
          </div>
          <ul className="admin-coming-list">
            <li>Analytics and usage stats</li>
            <li>Bulk paper import</li>
            <li>Admin user management</li>
          </ul>
        </div>
      </div>

      <div className="card admin-panel">
        <div className="admin-panel-header">
          <h2 className="text-headline-sm">Recently Added Papers</h2>
          <Link href="/admin/papers" className="view-all">
            View all
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px" }}
            >
              arrow_forward
            </span>
          </Link>
        </div>
        <PapersTable
          papers={recentPapers}
          loading={loading}
          onDelete={() => {}}
          compact
          showDelete={false}
        />
      </div>
    </section>
  );
}