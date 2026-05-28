"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import DepartmentCard from "@/components/DepartmentCard";
import BrowseByExamPeriod from "@/components/BrowseByExamPeriod";
import { departments } from "@/data/departments";
import { applyDepartmentStats, fetchAllPapers } from "@/lib/papers";

export default function Home() {
  const [departmentList, setDepartmentList] = useState(departments);
  const [examPeriods, setExamPeriods] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      setStatsLoading(true);
      try {
        const papers = await fetchAllPapers();
        const periodSet = new Set(
          papers.map((paper) => paper.examPeriod).filter(Boolean)
        );

        if (!isMounted) return;

        setDepartmentList(applyDepartmentStats(departments, papers));
        setExamPeriods(Array.from(periodSet).sort((a, b) => b.localeCompare(a)));
      } catch (error) {
        if (isMounted) {
          setDepartmentList(
            departments.map((dept) => ({
              ...dept,
              paperCount: 0,
              courseCount: 0,
            }))
          );
          setExamPeriods([]);
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    };

    fetchCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {/* Hero Search Section */}
      <section className="hero" id="hero-section">
        <div className="hero-pattern" />
        <div className="container hero-content">
          <span className="hero-badge">Past Paper Archive</span>
          <h1 className="text-headline-xl">
            Access Years of Academic Excellence
          </h1>
          <p className="text-body-lg hero-subtitle">
            Search through thousands of past examination papers, meticulously
            organized by department and paper for ARICT students.
          </p>
          <SearchBar />
        </div>
      </section>

      {/* Browse by Department */}
      <section className="department-section" id="departments-section">
        <div className="container">
          <div className="department-header">
            <div>
              <h2 className="text-headline-lg">Browse by Department</h2>
              <p className="text-body-md">
                Explore resources organized by academic faculties.
              </p>
            </div>
            <Link href="/search" className="view-all">
              View all{" "}
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px" }}
              >
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="department-grid">
            {departmentList.map((dept, index) => (
              <DepartmentCard
                key={dept.id}
                department={dept}
                index={index}
                loading={statsLoading}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="department-section" id="exam-periods-section">
        <div className="container">
          <BrowseByExamPeriod
            periods={examPeriods}
            linkBase="/search"
          />
        </div>
      </section>
    </>
  );
}
