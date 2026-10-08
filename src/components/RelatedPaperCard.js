import Link from "next/link";
import { getPaperRouteId } from "@/lib/papers";

export default function RelatedPaperCard({ paper }) {
  const encodedId = encodeURIComponent(getPaperRouteId(paper));
  const meta = [paper.examPeriod || paper.year, paper.semester].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/paper/${encodedId}?dept=${encodeURIComponent(
        paper.departmentFull || paper.department || ""
      )}`}
      className="related-card"
      id={`related-${paper.id}`}
    >
      <div className="related-card-header">
        <span className="code-tag">{paper.courseCode || "—"}</span>
        <span className="material-symbols-outlined related-card-arrow" aria-hidden="true">
          arrow_forward
        </span>
      </div>
      <h3>{paper.title}</h3>
      {meta && <p className="related-card-meta">{meta}</p>}
    </Link>
  );
}
