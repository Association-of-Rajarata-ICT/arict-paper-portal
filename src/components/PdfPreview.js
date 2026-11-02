"use client";

import { useEffect, useRef, useState } from "react";

const INITIAL_PAGES = 3;
const MAX_PAGES = 30;

// Renders a local PDF File to canvases with pdf.js. Browsers on phones (Android Chrome in
// particular) can't show a PDF inside an <iframe>, so this is what lets every student check
// they picked the right paper before uploading it. onStatusChange("ready" | "error") lets the
// form block uploads that can't be read.
export default function PdfPreview({ file, onStatusChange }) {
  const pagesRef = useRef(null);
  const onStatusChangeRef = useRef(onStatusChange);
  const [status, setStatus] = useState("loading");
  const [pageCount, setPageCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [previousFile, setPreviousFile] = useState(file);

  // A new file starts collapsed again (state adjusted during render, not in an effect).
  if (file !== previousFile) {
    setPreviousFile(file);
    setShowAll(false);
    setStatus("loading");
  }

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  });

  useEffect(() => {
    const container = pagesRef.current;
    let cancelled = false;
    let loadingTask = null;
    container.replaceChildren();

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        setPageCount(doc.numPages);
        setStatus("ready");
        onStatusChangeRef.current?.("ready");

        const count = Math.min(showAll ? MAX_PAGES : INITIAL_PAGES, doc.numPages);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        for (let number = 1; number <= count && !cancelled; number++) {
          const page = await doc.getPage(number);
          const scale = (container.clientWidth / page.getViewport({ scale: 1 }).width) * ratio;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = "pdf-preview-page";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `Page ${number} of ${doc.numPages}`);
          container.append(canvas);
          await page.render({ canvas, viewport }).promise;
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          onStatusChangeRef.current?.("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [file, showAll]);

  const shown = Math.min(showAll ? MAX_PAGES : INITIAL_PAGES, pageCount);

  return (
    <div className="pdf-preview">
      <div className="pdf-preview-head">
        <span className="material-symbols-outlined" aria-hidden="true">
          picture_as_pdf
        </span>
        <span className="pdf-preview-name">{file.name}</span>
        {status === "ready" && (
          <span className="pdf-preview-count">
            {pageCount} page{pageCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {status === "loading" && <p className="pdf-preview-message">Loading preview…</p>}
      {status === "error" && (
        <p className="pdf-preview-message pdf-preview-message--error">
          This file can&rsquo;t be previewed. It may be damaged, password-protected or not
          really a PDF. Check that it opens on your device, then choose it again.
        </p>
      )}

      <div className="pdf-preview-pages" ref={pagesRef} hidden={status === "error"} />

      {status === "ready" && pageCount > shown && !showAll && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAll(true)}>
          Show {pageCount > MAX_PAGES ? `the first ${MAX_PAGES}` : `all ${pageCount}`} pages
        </button>
      )}
    </div>
  );
}
