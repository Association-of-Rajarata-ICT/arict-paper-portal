"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { DEPARTMENT_NAMES } from "@/lib/constants";

const TABS = [
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const EDITABLE_FIELDS = ["subjectCode", "subjectName", "department", "year", "semester", "examPeriod"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
}

function formatSize(bytes) {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

async function reviewSubmission(id, body) {
  const response = await fetch(`/api/admin/submissions/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Could not update the submission.");
  return payload;
}

function PendingSubmission({ submission, focused, onReviewed, onReject }) {
  const [fields, setFields] = useState(() =>
    Object.fromEntries(EDITABLE_FIELDS.map((key) => [key, String(submission[key] ?? "")]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fieldId = (name) => `${name}-${submission.id}`;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleApprove = async () => {
    setBusy(true);
    setError("");
    try {
      const { paper } = await reviewSubmission(submission.id, { action: "approve", fields });
      onReviewed(submission.id, `Published ${paper.courseCode} — ${paper.title}.`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <article
      className={`card submission-card${focused ? " is-focused" : ""}`}
      id={`submission-${submission.id}`}
    >
      <div className="submission-card-head">
        <div className="submission-card-meta">
          <strong>{submission.submitterName}</strong> &lt;{submission.submitterEmail}&gt;
          <br />
          Sent {formatDate(submission.createdAt)} · {submission.fileName} {formatSize(submission.fileSize)}
          {submission.notes && <p className="submission-card-notes">{submission.notes}</p>}
        </div>
        <a
          className="btn btn-secondary"
          href={`/api/admin/submissions/${encodeURIComponent(submission.id)}/file`}
          target="_blank"
          rel="noreferrer"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            picture_as_pdf
          </span>
          Open PDF
        </a>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={fieldId("subjectCode")}>Subject code</label>
          <input id={fieldId("subjectCode")} name="subjectCode" className="input-field" value={fields.subjectCode} onChange={handleChange} />
        </div>
        <div className="form-field">
          <label htmlFor={fieldId("subjectName")}>Subject name</label>
          <input id={fieldId("subjectName")} name="subjectName" className="input-field" value={fields.subjectName} onChange={handleChange} />
        </div>
        <div className="form-field">
          <label htmlFor={fieldId("department")}>Department</label>
          <select id={fieldId("department")} name="department" className="input-field" value={fields.department} onChange={handleChange}>
            {DEPARTMENT_NAMES.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor={fieldId("examPeriod")}>Examination period</label>
          <input id={fieldId("examPeriod")} name="examPeriod" className="input-field" value={fields.examPeriod} onChange={handleChange} />
        </div>
        <div className="form-field">
          <label htmlFor={fieldId("year")}>Academic year</label>
          <select id={fieldId("year")} name="year" className="input-field" value={fields.year} onChange={handleChange}>
            {[1, 2, 3, 4].map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor={fieldId("semester")}>Semester</label>
          <select id={fieldId("semester")} name="semester" className="input-field" value={fields.semester} onChange={handleChange}>
            {[1, 2].map((semester) => (
              <option key={semester} value={semester}>
                Semester {semester}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="form-status form-status--error">{error}</div>}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => onReject(submission)} disabled={busy}>
          Reject
        </button>
        <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={busy}>
          {busy ? "Publishing…" : "Approve & publish"}
        </button>
      </div>
    </article>
  );
}

function ReviewedSubmission({ submission }) {
  return (
    <article className="card submission-card">
      <div className="submission-card-meta">
        <strong>
          {submission.subjectCode} — {submission.subjectName}
        </strong>
        <br />
        {submission.department} · Year {submission.year} · Semester {submission.semester} · {submission.examPeriod}
        <br />
        From {submission.submitterName} &lt;{submission.submitterEmail}&gt; · sent {formatDate(submission.createdAt)} ·
        reviewed {formatDate(submission.reviewedAt)}
        {submission.paperId && (
          <>
            {" · "}
            <Link href={`/paper/${encodeURIComponent(submission.paperId)}`} target="_blank">
              View paper
            </Link>
          </>
        )}
      </div>
    </article>
  );
}

export default function SubmissionsPage() {
  const [tab, setTab] = useState("pending");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ type: "idle", message: "" });
  const [pendingReject, setPendingReject] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  // ?id=... comes from the "new submission" email; that card is highlighted and scrolled to.
  const [focusId, setFocusId] = useState("");

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/submissions?status=${status}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Failed to load submissions.");
      setSubmissions(payload.submissions || []);
      setFocusId(new URLSearchParams(window.location.search).get("id") || "");
    } catch (err) {
      setNotice({ type: "error", message: err.message });
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  useEffect(() => {
    if (focusId) document.getElementById(`submission-${focusId}`)?.scrollIntoView({ block: "start" });
  }, [focusId, submissions]);

  const removeFromList = (id, message) => {
    setSubmissions((prev) => prev.filter((item) => item.id !== id));
    setNotice({ type: "success", message });
  };

  const handleRejectConfirm = async () => {
    setRejecting(true);
    try {
      const result = await reviewSubmission(pendingReject.id, { action: "reject" });
      removeFromList(
        pendingReject.id,
        result.driveWarning
          ? `Rejected, but the file was not removed from Drive: ${result.driveWarning}`
          : `Rejected ${pendingReject.subjectCode}. The file was moved to the Drive trash.`
      );
      setPendingReject(null);
    } catch (err) {
      setNotice({ type: "error", message: err.message });
    } finally {
      setRejecting(false);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="text-headline-lg">Student Submissions</h1>
          <p className="text-body-md">
            Papers uploaded from the Contribute page. Check each PDF, fix the details if needed, then publish it.
          </p>
        </div>
      </div>

      <div className="submission-tabs" role="tablist" aria-label="Submission status">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            className={`btn ${tab === item.value ? "btn-primary" : "btn-secondary"} btn-sm`}
            onClick={() => {
              setNotice({ type: "idle", message: "" });
              setTab(item.value);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {notice.type !== "idle" && <div className={`form-status form-status--${notice.type}`}>{notice.message}</div>}

      {loading ? (
        <div className="admin-empty-state">Loading submissions…</div>
      ) : submissions.length === 0 ? (
        <div className="card admin-empty-state">
          {tab === "pending" ? "No submissions are waiting for review." : `No ${tab} submissions yet.`}
        </div>
      ) : (
        <div className="submission-list">
          {submissions.map((submission) =>
            tab === "pending" ? (
              <PendingSubmission
                key={submission.id}
                submission={submission}
                focused={submission.id === focusId}
                onReviewed={removeFromList}
                onReject={setPendingReject}
              />
            ) : (
              <ReviewedSubmission key={submission.id} submission={submission} />
            )
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingReject)}
        title="Reject submission?"
        message={
          pendingReject
            ? `Reject ${pendingReject.subjectCode} — ${pendingReject.subjectName} from ${pendingReject.submitterName}? The PDF moves to the Drive trash.`
            : ""
        }
        confirmLabel="Reject"
        onConfirm={handleRejectConfirm}
        onCancel={() => setPendingReject(null)}
        loading={rejecting}
      />
    </section>
  );
}
