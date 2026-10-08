"use client";

import { openRequestPaper } from "@/lib/requestPaper";

export default function RequestPaperButton({ className = "btn btn-primary", children }) {
  return (
    <button type="button" className={className} onClick={openRequestPaper}>
      <span className="material-symbols-outlined" aria-hidden="true">
        note_add
      </span>
      {children || "Request a paper"}
    </button>
  );
}
