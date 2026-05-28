"use client";

import { DEPARTMENT_NAMES } from "@/lib/constants";
import { getDownloadUrl, getPreviewUrl } from "@/lib/papers";

export default function PaperForm({
  form,
  onChange,
  onFileChange,
  onSubmit,
  submitLabel = "Save Paper",
  submitting = false,
  status = { type: "idle", message: "" },
  requireFile = false,
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
          <select
            id="year"
            name="year"
            className="input-field"
            value={form.year}
            onChange={onChange}
            required
          >
            <option value="" disabled>
              Select year
            </option>
            {[1, 2, 3, 4].map((year) => (
              <option key={year} value={year}>
                Year {year}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="semester">Semester *</label>
          <select
            id="semester"
            name="semester"
            className="input-field"
            value={form.semester}
            onChange={onChange}
            required
          >
            <option value="" disabled>
              Select semester
            </option>
            {[1, 2].map((semester) => (
              <option key={semester} value={semester}>
                Semester {semester}
              </option>
            ))}
          </select>
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
          <label htmlFor="file">PDF File {requireFile ? "*" : ""}</label>
          <input
            id="file"
            name="file"
            className="input-field"
            type="file"
            accept="application/pdf"
            onChange={onFileChange}
            required={requireFile}
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
                  Upload or keep an existing PDF to see the preview here.
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