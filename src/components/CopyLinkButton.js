"use client";

import { useState } from "react";

export default function CopyLinkButton({ url, className }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const linkToCopy = url
        ? new URL(url, window.location.origin).href
        : window.location.href;
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <button type="button" className={className || "btn"} onClick={handleCopy}>
      <span className="material-symbols-outlined" aria-hidden="true">
        {copied ? "check" : "link"}
      </span>
      <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}
