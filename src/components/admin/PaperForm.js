"use client";

import { DEPARTMENT_NAMES } from "@/lib/constants";
import { getDownloadUrl, getPreviewUrl } from "@/lib/papers";

export default function PaperForm({
  form,
  onChange,
  onSubmit,
  submitLabel = "Save Paper",
  submitting = false,
  status = { type: "idle", message: "" },
}) {
  const previewUrl = getPreviewUrl(form.driveLink);
  const downloadUrl = getDownloadUrl(form.driveLink);

  return (
    <form className="card form-card" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="subjectCode">Subject Code *</label>
          <input
            id="subjectCode"
            name="subjectCode"
            className="input-field"
            value={form.subjectCode}
            onChange={onChange}
            placeholder="ICT3214"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="subjectName">Subject Name *</label>
          <input
            id="subjectName"
            name="subjectName"
            className="input-field"
            value={form.subjectName}
            onChange={onChange}
            placeholder="Mobile Application Development"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="year">Year *</label>
          <input
            id="year"
            name="year"
            className="input-field"
            value={form.year}
            onChange={onChange}
            placeholder="October | November 2025"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="department">Department *</label>
          <select
            id="department"
            name="department"
            className="input-field"
            value={form.department}
            onChange={onChange}
            required
          >
            <option value="" disabled>
              Select department
            </option>
            {DEPARTMENT_NAMES.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="instructor">Instructor</label>
          <input
            id="instructor"
            name="instructor"
            className="input-field"
            value={form.instructor}
            onChange={onChange}
            placeholder="Ms. A.K.N.L. Aththanagoda"
          />
        </div>
        <div className="form-field">
          <label htmlFor="driveLink">Drive Link</label>
          <input
            id="driveLink"
            name="driveLink"
            className="input-field"
            value={form.driveLink}
            onChange={onChange}
            placeholder="https://drive.google.com/..."
          />
        </div>
        <div className="form-field form-field--full">
          <div className="form-preview">
            <div className="form-preview-header">
              <h3 className="text-headline-sm">PDF Preview</h3>
              <div className="form-preview-actions">
                {previewUrl ? (
                  <a
                    className="btn btn-secondary"
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Preview
                  </a>
                ) : (
                  <button type="button" className="btn btn-secondary" disabled>
                    Open Preview
                  </button>
                )}
                {downloadUrl ? (
                  <a
                    className="btn btn-primary"
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download PDF
                  </a>
                ) : (
                  <button type="button" className="btn btn-primary" disabled>
                    Download PDF
                  </button>
                )}
              </div>
            </div>
            <div className="form-preview-frame">
              {previewUrl ? (
                <iframe
                  title="PDF preview"
                  src={previewUrl}
                  loading="lazy"
                  allow="autoplay"
                />
              ) : (
                <div className="form-preview-empty">
                  Add a Drive link to see the PDF preview here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {status.type !== "idle" && (
        <div className={`form-status form-status--${status.type}`}>
          {status.message}
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}