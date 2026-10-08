import Link from "next/link";
import Chip from "./Chip";
import { getDownloadUrl, getPaperRouteId } from "@/lib/papers";

export default function PaperListItem({ paper }) {
  const encodedId = encodeURIComponent(getPaperRouteId(paper));
  const paperUrl = `/paper/${encodedId}?dept=${encodeURIComponent(paper.departmentFull || paper.department || "")}`;
  const instructorName = paper.instructor && paper.instructor.trim() ? paper.instructor.trim() : "";
  const downloadUrl = getDownloadUrl(paper.driveLink || "");

  const meta = [
    paper.departmentFull || paper.department,
    paper.academicYear,
    paper.semester,
    paper.examPeriod,
  ].filter(Boolean);

  return (
    <article className="paper-row" id={`paper-list-${paper.id}`}>
      <div>
        <span className="code-tag">{paper.courseCode || "—"}</span>
      </div>

      <div style={{ minWidth: 0 }}>
        <h3 className="paper-row-title">
          <Link href={paperUrl}>{paper.title}</Link>
        </h3>
        <p className="paper-row-meta">
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </p>
        {(instructorName || paper.type || paper.difficulty || paper.duration || paper.isRestricted) && (
          <div className="paper-row-tags">
            {instructorName && <Chip icon="person">{instructorName}</Chip>}
            {paper.type && <Chip variant="accent">{paper.type}</Chip>}
            {paper.difficulty && <Chip icon="bar_chart">{paper.difficulty}</Chip>}
            {paper.duration && <Chip icon="schedule">{paper.duration}</Chip>}
            {paper.isRestricted && <Chip icon="lock">Restricted</Chip>}
          </div>
        )}
        {paper.description && (
          <p className="paper-row-description">{paper.description}</p>
        )}
      </div>

      <div className="paper-row-actions">
        <Link
          href={paperUrl}
          className="btn btn-secondary btn-sm"
          id={`list-view-details-${paper.id}`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            visibility
          </span>
          View
        </Link>
        {downloadUrl ? (
          <a
            href={downloadUrl}
            className="btn btn-primary btn-sm"
            target="_blank"
            rel="noreferrer"
            id={`list-download-${paper.id}`}
            aria-label={`Download ${paper.courseCode} ${paper.title}`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              download
            </span>
            Download
          </a>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled
            id={`list-download-${paper.id}`}
            title="No PDF available yet"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              download
            </span>
            Download
          </button>
        )}
      </div>
    </article>
  );
}
