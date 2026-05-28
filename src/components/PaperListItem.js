import Link from "next/link";
import Chip from "./Chip";
import { getDownloadUrl, getPaperRouteId } from "@/lib/papers";

export default function PaperListItem({ paper }) {
  const encodedId = encodeURIComponent(getPaperRouteId(paper));
  const paperUrl = `/paper/${encodedId}?dept=${encodeURIComponent(paper.departmentFull || paper.department || "")}`;
  const instructorName = paper.instructor && paper.instructor.trim() ? paper.instructor.trim() : "-";
  const downloadUrl = getDownloadUrl(paper.driveLink || "");
  
  return (
    <div className="paper-list-item" id={`paper-list-${paper.id}`}>
      <div className="paper-list-item-code">{paper.courseCode}</div>
      <div className="paper-list-item-content">
        <h3>{paper.title}</h3>
        <div className="paper-list-item-instructor">
          <span>Instructor:</span>
          {instructorName}
        </div>
        <div className="paper-list-item-chips">
          {paper.examPeriod && <Chip icon="calendar_today">{paper.examPeriod}</Chip>}
          {paper.academicYear && <Chip>{paper.academicYear}</Chip>}
          <Chip>{paper.department}</Chip>
          {paper.type && <Chip variant="accent">{paper.type}</Chip>}
          {paper.difficulty && (
            <Chip icon="bar_chart">{paper.difficulty}</Chip>
          )}
          {paper.duration && (
            <Chip icon="schedule">{paper.duration}</Chip>
          )}
          {paper.isRestricted && (
            <Chip icon="lock">Restricted</Chip>
          )}
        </div>
        {paper.description && (
          <p className="paper-list-item-description">{paper.description}</p>
        )}
      </div>
      <div className="paper-list-item-action" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {downloadUrl ? (
          <a
            href={downloadUrl}
            className="btn btn-primary"
            target="_blank"
            rel="noreferrer"
            id={`list-download-${paper.id}`}
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
          <button className="btn btn-primary" disabled id={`list-download-${paper.id}`}>
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
          id={`list-view-details-${paper.id}`}
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
