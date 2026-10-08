"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import Chip from "@/components/Chip";
import CodeBoxes from "@/components/CodeBoxes";
import CopyLinkButton from "@/components/CopyLinkButton";
import RelatedPaperCard from "@/components/RelatedPaperCard";
import { getPaperById, getRelatedPapers } from "@/data/papers";
import { fetchAllPapers, fetchPaperById, getDownloadUrl, getPreviewUrl } from "@/lib/papers";
import { openRequestPaper } from "@/lib/requestPaper";

export default function PaperDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  let id = rawId;
  if (rawId) {
    try {
      id = decodeURIComponent(rawId);
    } catch {
      id = rawId;
    }
  }
  const uuidMatch = String(id).match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
  const paperId = uuidMatch ? uuidMatch[0] : id;
  const deptParam = searchParams.get("dept") || "";
  const [paper, setPaper] = useState(null);
  const [relatedPapers, setRelatedPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPaper = async () => {
      if (!paperId) return;
      setLoading(true);

      try {
        let resolvedPaper = await fetchPaperById(deptParam, paperId);

        if (resolvedPaper) {
          if (isMounted) {
            setPaper(resolvedPaper);
          }

          const department = resolvedPaper.departmentFull || resolvedPaper.department;
          if (department) {
            const relatedData = (await fetchAllPapers())
              .filter(
                (item) =>
                  (item.departmentFull || item.department) === department &&
                  item.id !== resolvedPaper.id
              )
              .slice(0, 3);
            if (isMounted) {
              setRelatedPapers(relatedData);
            }
          }
        } else {
          const fallback = getPaperById(paperId);
          if (isMounted) {
            setPaper(fallback || null);
            setRelatedPapers(fallback ? getRelatedPapers(fallback.id) : []);
          }
        }
      } catch (error) {
        const fallback = getPaperById(paperId);
        if (isMounted) {
          setPaper(fallback || null);
          setRelatedPapers(fallback ? getRelatedPapers(fallback.id) : []);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPaper();

    return () => {
      isMounted = false;
    };
  }, [paperId, deptParam]);

  const breadcrumbItems = useMemo(() => {
    if (!paper) return [];
    return [
      { label: "Home", href: "/" },
      { label: "Papers", href: "/search" },
      {
        label: paper.departmentFull,
        href: `/search?q=${encodeURIComponent(paper.departmentFull)}`,
      },
      {
        label: `${paper.courseCode}-${paper.title
          .split(" ")
          .slice(0, 2)
          .join(" ")}`,
      },
    ];
  }, [paper]);

  if (loading) {
    return (
      <section className="paper-detail" id="paper-detail" aria-busy="true">
        <div className="container">
          <span className="skeleton" style={{ width: 280, height: 14 }} />
          <div className="paper-detail-layout">
            <div className="paper-preview">
              <span className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
            </div>
            <div className="paper-sheet">
              <span className="skeleton" style={{ width: 200, height: 34 }} />
              <span className="skeleton" style={{ width: "90%", height: 26, marginTop: 24 }} />
              <span className="skeleton" style={{ width: "100%", height: 180, marginTop: 24 }} />
              <span className="skeleton" style={{ width: "100%", height: 44, marginTop: 24 }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!paper) {
    return (
      <section className="paper-detail" id="paper-detail">
        <div className="container state-block">
          <h1 className="text-headline-lg">Paper not found</h1>
          <p>
            This paper may have been moved or removed. Search the archive, or ask ARICT to
            add it.
          </p>
          <div className="state-block-actions">
            <Link href="/search" className="btn btn-secondary">
              <span className="material-symbols-outlined" aria-hidden="true">
                search
              </span>
              Search papers
            </Link>
            <button type="button" className="btn btn-primary" onClick={openRequestPaper}>
              <span className="material-symbols-outlined" aria-hidden="true">
                note_add
              </span>
              Request a paper
            </button>
          </div>
        </div>
      </section>
    );
  }

  const previewUrl = getPreviewUrl(paper.driveLink || "");
  const downloadUrl = getDownloadUrl(paper.driveLink || "");
  const instructorName = paper.instructor && paper.instructor.trim() ? paper.instructor.trim() : "";

  const fields = [
    { label: "Department", value: paper.departmentFull },
    { label: "Academic year", value: paper.academicYear },
    { label: "Semester", value: paper.semester },
    { label: "Exam period", value: paper.examPeriod },
    { label: "Instructor", value: instructorName },
    ...(paper.duration ? [{ label: "Duration", value: paper.duration }] : []),
    ...(paper.fileSize ? [{ label: "File size", value: paper.fileSize }] : []),
  ];

  const handleShare = async () => {
    if (navigator.share) {
      navigator
        .share({
          title: paper.title,
          url: window.location.href,
        })
        .catch(console.error);
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Link copied. Paste it anywhere to share.");
    } catch {
      setShareMessage("Copy the link from the address bar to share this paper.");
    }
    setTimeout(() => setShareMessage(""), 3000);
  };

  return (
    <section className="paper-detail" id="paper-detail">
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        <div className="paper-detail-layout">
          <div className="paper-preview" id="paper-preview">
            <div className="paper-preview-bar">
              <span className="material-symbols-outlined" aria-hidden="true">
                picture_as_pdf
              </span>
              {paper.courseCode} preview
            </div>
            {previewUrl ? (
              <div className="paper-preview-frame">
                <iframe
                  title={`PDF preview of ${paper.courseCode} ${paper.title}`}
                  src={previewUrl}
                  loading="lazy"
                  allow="autoplay"
                />
                {/* Invisible overlay to block the 'Pop-out' / 'Open in new tab' button in Google Drive previews */}
                {previewUrl.includes("drive.google.com") && (
                  <div className="paper-preview-guard" aria-hidden="true" />
                )}
              </div>
            ) : (
              <div className="paper-preview-empty">
                <span className="material-symbols-outlined" aria-hidden="true">
                  description
                </span>
                No PDF preview is available for this paper yet.
              </div>
            )}
          </div>

          <aside className="paper-sheet" id="paper-detail-card" aria-label="Paper details">
            <div className="paper-sheet-head">
              <CodeBoxes code={paper.courseCode} size="lg" />
              {paper.isRestricted && <Chip icon="lock">Restricted</Chip>}
            </div>

            <h1 className="paper-sheet-title">{paper.title}</h1>

            {paper.type && (
              <div className="paper-sheet-tags">
                <Chip variant="accent">{paper.type}</Chip>
              </div>
            )}

            <dl className="paper-sheet-fields">
              {fields.map((field) => (
                <div key={field.label} className="paper-sheet-field">
                  <dt>{field.label}</dt>
                  <dd>{field.value || "—"}</dd>
                </div>
              ))}
            </dl>

            <div className="paper-sheet-actions">
              {downloadUrl ? (
                <a
                  className="btn btn-primary btn-lg"
                  id="download-btn"
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    download
                  </span>
                  Download PDF
                </a>
              ) : (
                <button type="button" className="btn btn-primary btn-lg" id="download-btn" disabled>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    download
                  </span>
                  Download PDF
                </button>
              )}
              <button type="button" className="btn btn-secondary" id="share-btn" onClick={handleShare}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  share
                </span>
                Share
              </button>
              <CopyLinkButton className="btn btn-secondary" />
            </div>
            <p className="share-feedback" role="status">
              {shareMessage}
            </p>
          </aside>
        </div>

        {relatedPapers.length > 0 && (
          <section className="related-section" id="related-papers" aria-labelledby="related-heading">
            <div className="section-head">
              <div>
                <h2 id="related-heading" className="text-headline-md">
                  More from {paper.departmentFull}
                </h2>
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(paper.departmentFull)}`}
                className="link-arrow"
              >
                All {paper.departmentFull} papers
                <span className="material-symbols-outlined" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
            <div className="related-grid">
              {relatedPapers.map((rp) => (
                <RelatedPaperCard key={rp.id} paper={rp} />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
