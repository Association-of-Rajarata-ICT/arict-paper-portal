import Link from "next/link";
import Chip from "./Chip";
import { getDownloadUrl, getPaperRouteId } from "@/lib/papers";

export default function PaperCard({ paper, compact = false }) {
  const encodedId = encodeURIComponent(getPaperRouteId(paper));
  const paperUrl = `/paper/${encodedId}?dept=${encodeURIComponent(paper.departmentFull || paper.department || "")}`;
  const instructorName = paper.instructor && paper.instructor.trim() ? paper.instructor.trim() : "";
  const downloadUrl = getDownloadUrl(paper.driveLink || "");
  
  return (
    <div
      className={`card paper-card${compact ? " paper-card-compact" : ""}`}
      id={`paper-card-${paper.id}`}
    >
      <div className="paper-card-body">
        <div className="paper-card-chips">
          <Chip icon="calendar_today">{paper.year}</Chip>
          <Chip>{paper.department}</Chip>
          {paper.type && <Chip variant="accent">{paper.type}</Chip>}
          {paper.isRestricted && (
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "18px",
                color: "var(--color-secondary)",
                alignSelf: "center",
              }}
            >
              lock
            </span>
          )}
        </div>
        <div className="paper-card-code">{paper.courseCode}</div>
        <h3>{paper.title}</h3>
        {instructorName && (
          <p className="paper-card-instructor">
            Instructor: <span>{instructorName}</span>
          </p>
        )}
        {paper.description && (
          <p className="paper-card-description">{paper.description}</p>
        )}
      </div>
      <div className="paper-card-footer">
        {downloadUrl ? (
          <a
            href={downloadUrl}
            className="btn btn-primary"
            target="_blank"
            rel="noreferrer"
            id={`download-${paper.id}`}
          >
            Download
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px" }}
            >
              download
            </span>
          </a>
        ) : (
          <button className="btn btn-primary" disabled id={`download-${paper.id}`}>
            Download
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px" }}
            >
              download
            </span>
          </button>
        )}
        <Link
          href={paperUrl}
          className="btn btn-secondary"
          id={`view-details-${paper.id}`}
        >
          View Details
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px" }}
          >
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
}
