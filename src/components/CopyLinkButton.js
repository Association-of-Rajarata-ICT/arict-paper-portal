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
    <button
      className={className || "btn"}
      onClick={handleCopy} 
      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
        {copied ? "check" : "link"}
      </span>
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}