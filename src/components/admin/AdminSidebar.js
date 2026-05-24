"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/lib/constants";

export default function AdminSidebar({ mobileOpen, onClose }) {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      <div
        className={`admin-sidebar-overlay ${mobileOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <Link href="/admin" className="admin-sidebar-brand" onClick={onClose}>
            <Image src="/logo.png" alt="ARICT Logo" width={120} height={34} />
            <span>Admin</span>
          </Link>
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link ${isActive(item.href) ? "active" : ""}`}
              onClick={onClose}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link
            href="/"
            className="admin-sidebar-link admin-sidebar-link--muted"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">open_in_new</span>
            View Site
          </Link>
        </div>
      </aside>
    </>
  );
}
