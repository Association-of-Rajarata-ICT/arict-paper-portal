"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import SearchBar from "@/components/SearchBar";
import DepartmentCard from "@/components/DepartmentCard";
import { departments } from "@/data/departments";
import { db } from "@/lib/firebase";

export default function Home() {
  const [departmentList, setDepartmentList] = useState(departments);

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const counts = await Promise.all(
          departments.map(async (dept) => {
            const snapshot = await getDocs(collection(db, dept.name));
            return { id: dept.id, count: snapshot.size };
          })
        );

        if (!isMounted) return;

        setDepartmentList(
          departments.map((dept) => {
            const match = counts.find((item) => item.id === dept.id);
            return {
              ...dept,
              paperCount: Number.isFinite(match?.count)
                ? match.count
                : 0,
            };
          })
        );
      } catch (error) {
        if (isMounted) {
          setDepartmentList(
            departments.map((dept) => ({
              ...dept,
              paperCount: Number.isFinite(dept.paperCount) ? dept.paperCount : 0,
            }))
          );
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
            organized by department and course for ARICT students.
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
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
