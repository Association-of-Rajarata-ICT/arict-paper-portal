"use client";

const STORAGE_KEY = "arict-theme";

function getEffectiveTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle({ className = "" }) {
  const handleToggle = () => {
    const next = getEffectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the theme still applies for this visit.
    }
  };

  // Icons swap through CSS so server and client markup always match.
  return (
    <button
      type="button"
      className={`icon-btn theme-toggle ${className}`.trim()}
      onClick={handleToggle}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
    >
      <span className="material-symbols-outlined icon-dark" aria-hidden="true">
        dark_mode
      </span>
      <span className="material-symbols-outlined icon-light" aria-hidden="true">
        light_mode
      </span>
    </button>
  );
}
