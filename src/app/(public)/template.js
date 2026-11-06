"use client";

import { useEffect } from "react";

// A template remounts on every navigation, so its wrapper replays the enter animation for each new page.
// The very first page load is left alone: animating it would only delay first paint (and LCP).
const session = { navigated: false };

export default function PublicTemplate({ children }) {
  const animate = session.navigated;

  useEffect(() => {
    session.navigated = true;
  }, []);

  return <div className={animate ? "page-transition is-entering" : "page-transition"}>{children}</div>;
}
