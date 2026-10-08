"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import RequestPaperModal from "@/components/RequestPaperModal";
import ThemeToggle from "@/components/ThemeToggle";
import { REQUEST_PAPER_EVENT } from "@/lib/requestPaper";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Papers" },
  // Temporarily hidden — uncomment to restore Faculty in navigation
  // { href: "/faculty", label: "Faculty" },
  { href: "/about", label: "About Us" },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href === "/search") return pathname === "/search" || pathname.startsWith("/paper/");
  return pathname === href;
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const pathname = usePathname();

  const openRequestModal = () => {
    setMobileOpen(false);
    setRequestOpen(true);
  };

  useEffect(() => {
    const handleRequest = () => openRequestModal();
    window.addEventListener(REQUEST_PAPER_EVENT, handleRequest);
    return () => window.removeEventListener(REQUEST_PAPER_EVENT, handleRequest);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header" id="main-header">
        <div className="container site-header-inner">
          <Link href="/" className="brand" aria-label="ARICT Paper Portal home">
            <Image
              src="/logo.png"
              alt="ARICT"
              width={103}
              height={32}
              className="brand-logo"
              priority
            />
            <span className="brand-label">
              Paper
              <br />
              Portal
            </span>
          </Link>

          <nav className="site-nav" id="desktop-nav" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="site-header-actions">
            <ThemeToggle />
            <button
              type="button"
              className="btn btn-primary btn-sm header-request"
              id="request-paper-btn"
              onClick={openRequestModal}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                note_add
              </span>
              Request a paper
            </button>
            <button
              type="button"
              className="icon-btn header-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              id="hamburger-btn"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                menu
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`drawer-scrim ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`mobile-menu ${mobileOpen ? "open" : ""}`}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="mobile-menu-header">
          <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
            <Image src="/logo.png" alt="ARICT" width={90} height={28} className="brand-logo" />
          </Link>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <nav className="mobile-menu-nav" aria-label="Mobile">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          ))}
        </nav>

        <div className="mobile-menu-actions">
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={openRequestModal}>
            <span className="material-symbols-outlined" aria-hidden="true">
              note_add
            </span>
            Request a paper
          </button>
        </div>
      </div>

      <RequestPaperModal open={requestOpen} onClose={() => setRequestOpen(false)} />
    </>
  );
}
