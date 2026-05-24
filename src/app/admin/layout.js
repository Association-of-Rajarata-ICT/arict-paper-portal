"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="admin-topbar-meta">
            <span className="admin-topbar-title">ARICT Admin</span>
            <span className="admin-topbar-subtitle">Past Paper Portal</span>
          </div>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}