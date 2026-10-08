"use client";

import Link from "next/link";

export default function BrowseByExamPeriod({
  periods = [],
  linkBase = "/search",
  queryParamName = "years",
  loading = false,
}) {
  const hasPeriods = periods.length > 0;
  const buildHref = (period) =>
    `${linkBase}?${queryParamName}=${encodeURIComponent(period)}`;

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
      <div className="period-grid">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <span key={index} className="skeleton" style={{ height: 60 }} />
          ))
        ) : hasPeriods ? (
          periods.map((period) => (
            <Link key={period} className="period-slip" href={buildHref(period)}>
              <span className="material-symbols-outlined" aria-hidden="true">
                event_note
              </span>
              <span className="period-slip-text">{period}</span>
              <span className="material-symbols-outlined period-slip-arrow" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          ))
        ) : (
          <p className="period-empty">No examination periods available yet.</p>
        )}
      </div>
    </section>
  );
}
