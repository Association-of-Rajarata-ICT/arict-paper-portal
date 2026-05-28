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
      <form className="search-inline" onSubmit={handleSearch} id="inline-search">
        <span
          className="material-symbols-outlined search-icon"
          style={{ fontSize: "20px" }}
        >
          search
        </span>
        <input
          type="text"
          placeholder="Search papers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          id="inline-search-input"
        />
      </form>
    );
  }

  return (
    <form
      className="hero-search-wrapper"
      onSubmit={handleSearch}
      style={{ position: "relative" }}
      id="hero-search"
    >
      <span className="material-symbols-outlined hero-search-icon">
        search
      </span>
      <input
        type="text"
        className="input-field"
        placeholder="Search by course code, module name, or year..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        id="hero-search-input"
      />
      <button type="submit" className="btn btn-primary btn-lg" id="hero-search-btn">
        Search
      </button>
    </form>
  );
}
