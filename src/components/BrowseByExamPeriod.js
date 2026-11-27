"use client";

import Link from "next/link";

// Exam periods grouped under the calendar year they were sat in, newest year first.
function groupByYear(periods) {
  const groups = new Map();
  for (const period of periods) {
    const year = String(period).match(/(?:19|20)\d{2}/)?.[0] || "Other";
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(period);
  }
  return [...groups].sort(([a], [b]) => (Number(b) || 0) - (Number(a) || 0));
}

export default function BrowseByExamPeriod({
  periods = [],
  linkBase = "/search",
  queryParamName = "years",
  loading = false,
}) {
  const buildHref = (period) => `${linkBase}?${queryParamName}=${encodeURIComponent(period)}`;

  return (
    <section className="exam-period-section" id="exam-period-section" aria-labelledby="exam-period-heading">
      <div className="section-head">
        <div>
          <h2 id="exam-period-heading" className="text-headline-md">
            Examination periods
          </h2>
          <p>Open every paper sat in one exam session.</p>
        </div>
      </div>
      {loading ? (
        <span className="skeleton" style={{ height: 160 }} />
      ) : periods.length > 0 ? (
        <div className="period-table">
          {groupByYear(periods).map(([year, list]) => (
            <div key={year} className="period-row">
              <h3 className="period-year">{year}</h3>
              <ul className="period-list">
                {list.map((period) => (
                  <li key={period}>
                    <Link className="period-chip" href={buildHref(period)}>
                      {period}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="period-empty">No examination periods available yet.</p>
      )}
    </section>
  );
}
