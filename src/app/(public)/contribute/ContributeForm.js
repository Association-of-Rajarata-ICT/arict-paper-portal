"use client";

import { useRef, useState } from "react";
import { DEPARTMENT_NAMES } from "@/lib/constants";
import { SUBMISSION_MAX_BYTES, SUBMISSION_MAX_MB } from "@/lib/submissionLimits";

const initialForm = {
  submitterName: "",
  submitterEmail: "",
  subjectCode: "",
  subjectName: "",
  department: "",
  year: "",
  semester: "",
  examPeriod: "",
  notes: "",
  website: "",
};

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Something went wrong. Please try again.");
  return payload;
}

// Sends the PDF straight to Google Drive, reporting progress. Resolves with the Drive file id.
function uploadToDrive(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) return resolve(JSON.parse(xhr.responseText).id);
      } catch {
        // Fall through to the error below.
      }
      reject(new Error("The upload didn't finish. Check your connection and try again."));
    };
    xhr.onerror = () => reject(new Error("The upload was interrupted. Check your connection and try again."));
    xhr.send(file);
  });
}

export default function ContributeForm() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const fileInputRef = useRef(null);
  const submitting = progress !== null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const chosen = event.target.files?.[0] || null;
    setStatus({ type: "idle", message: "" });
    if (chosen && !/\.pdf$/i.test(chosen.name)) {
      setStatus({ type: "error", message: "Please choose a PDF file." });
      event.target.value = "";
      setFile(null);
      return;
    }
    if (chosen && chosen.size > SUBMISSION_MAX_BYTES) {
      setStatus({ type: "error", message: `The PDF must be ${SUBMISSION_MAX_MB} MB or smaller.` });
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(chosen);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setStatus({ type: "error", message: "Choose the PDF of the paper to upload." });
      return;
    }

    setStatus({ type: "idle", message: "" });
    setProgress(0);
    try {
      const { id, token, uploadUrl } = await postJson("/api/submissions", {
        ...form,
        fileName: file.name,
        fileSize: file.size,
      });
      const fileId = await uploadToDrive(uploadUrl, file, setProgress);
      await postJson(`/api/submissions/${encodeURIComponent(id)}/complete`, { token, fileId });

      setStatus({
        type: "success",
        message:
          "Thank you! Your paper is in the review queue. Once the ARICT team checks it, it will appear in the archive.",
      });
      // Keep the contributor's name and email for their next upload.
      setForm((prev) => ({
        ...initialForm,
        submitterName: prev.submitterName,
        submitterEmail: prev.submitterEmail,
      }));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setProgress(null);
    }
  };

  return (
    <form className="card form-card contribute-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="submitterName">Your name *</label>
          <input
            id="submitterName"
            name="submitterName"
            className="input-field"
            value={form.submitterName}
            onChange={handleChange}
            placeholder="Full name"
            autoComplete="name"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="submitterEmail">Your email *</label>
          <input
            id="submitterEmail"
            name="submitterEmail"
            type="email"
            className="input-field"
            value={form.submitterEmail}
            onChange={handleChange}
            placeholder="ict20*****@as.rjt.ac.lk"
            autoComplete="email"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="subjectCode">Subject code *</label>
          <input
            id="subjectCode"
            name="subjectCode"
            className="input-field"
            value={form.subjectCode}
            onChange={handleChange}
            placeholder="ICT3214"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="subjectName">Subject name *</label>
          <input
            id="subjectName"
            name="subjectName"
            className="input-field"
            value={form.subjectName}
            onChange={handleChange}
            placeholder="Mobile Application Development"
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
            onChange={handleChange}
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
          <label htmlFor="examPeriod">Examination period *</label>
          <input
            id="examPeriod"
            name="examPeriod"
            className="input-field"
            value={form.examPeriod}
            onChange={handleChange}
            placeholder="October | November 2025"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="year">Academic year *</label>
          <select id="year" name="year" className="input-field" value={form.year} onChange={handleChange} required>
            <option value="" disabled>
              Select academic year
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
            onChange={handleChange}
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
        <div className="form-field form-field--full">
          <label htmlFor="file">Paper PDF * (up to {SUBMISSION_MAX_MB} MB)</label>
          <input
            id="file"
            name="file"
            ref={fileInputRef}
            className="input-field"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            required
          />
        </div>
        <div className="form-field form-field--full">
          <label htmlFor="notes">Notes for the reviewers</label>
          <textarea
            id="notes"
            name="notes"
            className="input-field"
            value={form.notes}
            onChange={handleChange}
            placeholder="Anything that helps, e.g. which pages are missing or whether this is Part I or Part II."
            rows={3}
          />
        </div>
        {/* Hidden from people; bots that fill every field get rejected by the server. */}
        <div className="contribute-trap" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={handleChange}
          />
        </div>
      </div>

      {submitting && (
        <div className="upload-progress" role="status">
          <div className="upload-progress-bar">
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <span className="upload-progress-label">
            {progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : "Checking the file…"}
          </span>
        </div>
      )}

      {status.type !== "idle" && (
        <div className={`form-status form-status--${status.type}`} role={status.type === "error" ? "alert" : "status"}>
          {status.message}
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          <span className="material-symbols-outlined" aria-hidden="true">
            upload_file
          </span>
          {submitting ? "Uploading…" : "Submit for review"}
        </button>
      </div>
    </form>
  );
}
