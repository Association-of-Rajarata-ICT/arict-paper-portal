"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Login failed.");
      }
      const next = searchParams.get("next") || "";
      // Only follow same-site admin paths.
      router.replace(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form className="card form-card admin-login-card" onSubmit={handleSubmit}>
      <div className="admin-login-brand">
        <span className="brand-logo-wrap">
          <Image src="/logo.png" alt="ARICT Logo" width={120} height={34} className="brand-logo--light" />
          <Image src="/logo-dark.png" alt="ARICT Logo" width={120} height={34} className="brand-logo--dark" />
        </span>
        <h1 className="text-headline-sm">Admin sign in</h1>
      </div>

      <div className="form-field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          className="input-field"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          required
          autoFocus
        />
      </div>
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          className="input-field"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          required
        />
      </div>

      {error && <div className="form-status form-status--error">{error}</div>}

      <button type="submit" className="btn btn-primary admin-login-submit" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="admin-login">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
