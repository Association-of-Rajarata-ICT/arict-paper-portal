import Link from "next/link";
import RequestPaperButton from "@/components/RequestPaperButton";

export default function PaperNotFound() {
  return <section className="paper-detail">
    <div className="container state-block">
      <h1 className="text-headline-lg">Paper not found</h1>
      <p>This paper may have been moved or removed. Browse the archive or request the paper you need.</p>
      <div className="state-block-actions">
        <Link href="/search" className="btn btn-secondary">Search past papers</Link>
        <RequestPaperButton />
      </div>
    </div>
  </section>;
}
