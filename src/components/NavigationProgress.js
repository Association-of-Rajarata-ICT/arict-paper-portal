"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Thin maroon bar along the top of the window while the next page loads. On a move to a different
// page it also fades the current page slightly, so the click is acknowledged straight away.
// Works on the DOM directly: no re-renders, no animation library.
const SAFETY_MS = 10000;

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef(null);
  const timers = useRef([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function finish() {
    const bar = barRef.current;
    delete document.documentElement.dataset.navigating;
    if (!bar || bar.dataset.state !== "loading") return;
    clearTimers();
    bar.dataset.state = "done";
    timers.current.push(setTimeout(() => (bar.dataset.state = "idle"), 400));
  }

  // Treat the URL change as the end of the navigation.
  useEffect(finish, [pathname, searchParams]);

  useEffect(() => {
    function start(changesPage) {
      const bar = barRef.current;
      if (!bar) return;
      clearTimers();
      if (bar.dataset.state !== "idle") {
        bar.dataset.state = "idle";
        void bar.offsetWidth; // restart from zero
      }
      bar.dataset.state = "loading";
      if (changesPage) document.documentElement.dataset.navigating = "";
      timers.current.push(setTimeout(finish, SAFETY_MS));
    }

    function onClick(event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      // Same page, or only a #hash jump: nothing loads.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      start(url.pathname !== window.location.pathname);
    }

    // Capture phase, so this runs before next/link handles the click.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
      delete document.documentElement.dataset.navigating;
    };
    // finish only touches refs, so the listener never needs re-binding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={barRef} className="nav-progress" data-state="idle" aria-hidden="true" />;
}
