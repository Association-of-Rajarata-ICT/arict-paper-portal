import Link from "next/link";
import Chip from "./Chip";
import { getDownloadUrl, getPaperRouteId } from "@/lib/papers";

export default function PaperCard({ paper, compact = false }) {
  const encodedId = encodeURIComponent(getPaperRouteId(paper));
  const paperUrl = `/paper/${encodedId}?dept=${encodeURIComponent(paper.departmentFull || paper.department || "")}`;
  const instructorName = paper.instructor && paper.instructor.trim() ? paper.instructor.trim() : "";
  const downloadUrl = getDownloadUrl(paper.driveLink || "");
  const titleId = `paper-card-title-${paper.id}`;

  return (
    <article
      className={`paper-card${compact ? " paper-card-compact" : ""}`}
      id={`paper-card-${paper.id}`}
      aria-labelledby={titleId}
    >
      <div className="paper-card-top">
        <span className="code-tag">{paper.courseCode || "—"}</span>
        {paper.isRestricted && (
          <span
            className="material-symbols-outlined paper-card-lock"
            role="img"
            aria-label="Restricted"
          >
            lock
          </span>
        )}
      </div>

      <h3 className="paper-card-title" id={titleId}>
        <Link href={paperUrl}>{paper.title}</Link>
      </h3>
      <p className="paper-card-dept">{paper.departmentFull || paper.department}</p>

      <div className="paper-card-tags">
        {paper.academicYear && <Chip>{paper.academicYear}</Chip>}
        {paper.semester && <Chip>{paper.semester}</Chip>}
        {paper.examPeriod && <Chip icon="calendar_today">{paper.examPeriod}</Chip>}
        {paper.type && <Chip variant="accent">{paper.type}</Chip>}
      </div>

      {instructorName && (
        <p className="paper-card-instructor">
          <span className="material-symbols-outlined" aria-hidden="true">
            person
          </span>
          {instructorName}
        </p>
      )}
      {paper.description && (
        <p className="paper-card-description">{paper.description}</p>
      )}

      <div className="paper-card-actions">
        <Link
          href={paperUrl}
          className="btn btn-secondary btn-sm"
          id={`view-details-${paper.id}`}
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
            id={`download-${paper.id}`}
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
            id={`download-${paper.id}`}
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
