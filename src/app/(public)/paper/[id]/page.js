"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import Chip from "@/components/Chip";
import CopyLinkButton from "@/components/CopyLinkButton";
import RelatedPaperCard from "@/components/RelatedPaperCard";
import { getPaperById, getRelatedPapers } from "@/data/papers";
import { fetchAllPapers, fetchPaperById, getDownloadUrl, getPreviewUrl } from "@/lib/papers";

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
      <section className="paper-detail" id="paper-detail">
        <div className="container">
          <h1 className="text-headline-lg">Loading...</h1>
        </div>
      </section>
    );
  }

  if (!paper) {
    return (
      <section className="paper-detail" id="paper-detail">
        <div className="container">
          <h1 className="text-headline-lg">Paper Not Found</h1>
          <p className="text-body-md" style={{ color: "var(--color-secondary)" }}>
            The paper you are looking for does not exist.
          </p>
        </div>
      </section>
    );
  }

  const previewUrl = getPreviewUrl(paper.driveLink || "");
  const downloadUrl = getDownloadUrl(paper.driveLink || "");

  return (
    <section className="paper-detail" id="paper-detail">
      <div className="container">
        <Breadcrumb items={breadcrumbItems} />

        {/* Main Detail Card */}
        <div className="paper-detail-card" id="paper-detail-card" style={{ display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ flex: "1 1 0%", minWidth: "280px" }}>
              <div className="paper-detail-chips">
                {paper.type && <Chip>{paper.type}</Chip>}
                <Chip>{paper.semester}</Chip>
              </div>

              <h1 className="text-headline-xl paper-detail-title">
                {paper.title}
              </h1>

              <p className="paper-detail-module">
                Module Code: {paper.courseCode}
              </p>

              <div className="paper-detail-meta">
                <div className="paper-detail-meta-item">
                  <label>Examination period</label>
                  <span>{paper.year}</span>
                </div>
                <div className="paper-detail-meta-item">
                  <label>Department</label>
                  <span>{paper.departmentFull}</span>
                </div>
                <div className="paper-detail-meta-item">
                  <label>Instructor</label>
                  <span>{paper.instructor && paper.instructor.trim() ? paper.instructor.trim() : "-"}</span>
                </div>
                {paper.duration && (
                  <div className="paper-detail-meta-item">
                    <label>Duration</label>
                    <span>{paper.duration}</span>
                  </div>
                )}
                {paper.fileSize && (
                  <div className="paper-detail-meta-item">
                    <label>File Size</label>
                    <span>{paper.fileSize}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="paper-detail-actions" style={{ display: "flex", flexDirection: "column", gap: "12px", flex: "0 0 auto", minWidth: "200px" }}>
              {downloadUrl ? (
                <a
                  className="btn btn-primary"
                  id="download-btn"
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "20px" }}
                  >
                    download
                  </span>
                  Download PDF
                </a>
              ) : (
                <button className="btn btn-primary" id="download-btn" disabled>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "20px" }}
                  >
                    download
                  </span>
                  Download PDF
                </button>
              )}
              <button
                className="btn btn-secondary"
                id="share-btn"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: paper.title,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  share
                </span>
                Share
              </button>
              <CopyLinkButton className="btn btn-secondary" />
            </div>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="paper-detail-preview" style={{ marginTop: "24px", width: "100%", minHeight: "600px", height: "75vh", position: "relative" }}>
          {previewUrl ? (
            <>
              <iframe
                title="PDF preview"
                src={previewUrl}
                loading="lazy"
                allow="autoplay"
                style={{ width: "100%", height: "100%", border: "none", borderRadius: "12px", backgroundColor: "var(--color-surface)" }}
              />
              {/* Invisible overlay to block the 'Pop-out' / 'Open in new tab' button in Google Drive previews */}
              {previewUrl.includes("drive.google.com") && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "60px",
                    height: "60px",
                    zIndex: 10,
                    backgroundColor: "transparent",
                  }}
                />
              )}
            </>
          ) : (
            <div className="paper-detail-preview-inner" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-surface)", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
              <span className="material-symbols-outlined file-icon" style={{ fontSize: "48px", color: "var(--color-secondary)", marginBottom: "8px" }}>
                description
              </span>
              <div className="file-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px", color: "var(--color-primary)" }}
                >
                  picture_as_pdf
                </span>
                No PDF preview available
              </div>
            </div>
          )}
        </div>

        {/* Related Papers */}
        <div className="related-section" id="related-papers">
          <h2 className="text-headline-md">Related Papers</h2>
          <div className="related-grid">
            {relatedPapers.map((rp) => (
              <RelatedPaperCard key={rp.id} paper={rp} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
