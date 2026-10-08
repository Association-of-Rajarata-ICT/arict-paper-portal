"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar({ variant = "hero", defaultValue = "" }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (variant === "inline") {
    return (
      <form className="search-inline" onSubmit={handleSearch} id="inline-search" role="search">
        <span className="material-symbols-outlined" aria-hidden="true">
          search
        </span>
        <label htmlFor="inline-search-input" className="sr-only">
          Search papers
        </label>
        <input
          type="search"
          placeholder="Course code or module name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          id="inline-search-input"
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit" className="search-inline-submit" aria-label="Search">
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </button>
      </form>
    );
  }

  return (
    <form className="hero-search" onSubmit={handleSearch} id="hero-search" role="search">
      <label htmlFor="hero-search-input" className="field-label">
        Course code, module name or exam year
      </label>
      <div className="hero-search-row">
        <span className="material-symbols-outlined" aria-hidden="true">
          search
        </span>
        <input
          type="search"
          placeholder="e.g. ICT3214 or Database Systems"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          id="hero-search-input"
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary btn-lg" id="hero-search-btn">
          Search
        </button>
      </div>
    </form>
  );
}
