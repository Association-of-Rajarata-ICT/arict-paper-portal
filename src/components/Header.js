"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Departments" },
  { href: "/search", label: "Courses" },
  { href: "/faculty", label: "Faculty" },
  { href: "/about", label: "About Us" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="header" id="main-header">
        <div className="header-inner container">
          <Link href="/" className="header-brand">
            <Image
              src="/logo.png"
              alt="ARICT Logo"
              width={140}
              height={40}
              priority
            />
            <span>PAPER PORTAL</span>
          </Link>

          <nav className="header-nav" id="desktop-nav">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={pathname === link.href ? "active" : ""}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link href="/search" className="btn btn-secondary" id="login-btn">
              Login
            </Link>
            <Link
              href="/search"
              className="btn btn-primary"
              id="register-btn"
              style={{ display: "none" }}
            >
              Register
            </Link>
            <Link
              href="/search"
              className="btn btn-primary register-desktop"
              id="register-btn-desktop"
            >
              Register
            </Link>
            <button
              className="header-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              id="hamburger-btn"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`} id="mobile-menu">
        <div className="mobile-menu-header">
          <Link href="/" className="header-brand" onClick={() => setMobileOpen(false)}>
            <Image src="/logo.png" alt="ARICT Logo" width={28} height={28} />
            <span style={{ fontSize: "20px" }}>ARICT Portal</span>
          </Link>
          <button
            className="mobile-menu-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="mobile-menu-nav">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mobile-menu-actions">
          <Link href="/search" className="btn btn-secondary" onClick={() => setMobileOpen(false)}>
            Login
          </Link>
          <Link href="/search" className="btn btn-primary" onClick={() => setMobileOpen(false)}>
            Register
          </Link>
        </div>
      </div>

      <style jsx>{`
        .register-desktop {
          display: inline-flex;
        }
        @media (max-width: 639px) {
          .register-desktop {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
