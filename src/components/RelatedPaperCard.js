import Link from "next/link";
import Chip from "./Chip";
import { getPaperRouteId } from "@/lib/papers";

export default function RelatedPaperCard({ paper }) {
  const encodedId = encodeURIComponent(getPaperRouteId(paper));
  return (
    <Link
      href={`/paper/${encodedId}?dept=${encodeURIComponent(
        paper.departmentFull || paper.department || ""
      )}`}
      className="related-card"
      id={`related-${paper.id}`}
    >
      <div className="related-card-header">
        {paper.examPeriod ? <Chip>{paper.examPeriod}</Chip> : <Chip>{paper.year}</Chip>}
        <span className="material-symbols-outlined related-card-download">
          download
        </span>
      </div>
      <h3>{paper.title}</h3>
      <p className="related-card-meta">
        {paper.courseCode} · {paper.semester}
      </p>
    </Link>
  );
}
