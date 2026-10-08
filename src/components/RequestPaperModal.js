"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import emailjs from "@emailjs/browser";
import { ARICT_OFFICIAL_EMAIL, DEPARTMENT_NAMES } from "@/lib/constants";

const initialForm = {
  studentName: "",
  studentEmail: "",
  subjectCode: "",
  subjectName: "",
  department: "",
  examYear: "",
  message: "",
};

const emailJsConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "",
};

export default function RequestPaperModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape" && !submitting) {
        setStatus({ type: "idle", message: "" });
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, submitting, onClose]);

  if (!open || !mounted) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (submitting) return;
    setStatus({ type: "idle", message: "" });
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    if (
      !form.studentName ||
      !form.studentEmail ||
      !form.subjectCode ||
      !form.subjectName ||
      !form.department ||
      !form.examYear
    ) {
      setStatus({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    if (
      !emailJsConfig.serviceId ||
      !emailJsConfig.templateId ||
      !emailJsConfig.publicKey
    ) {
      setStatus({
        type: "error",
        message:
          "Email service is not configured yet. Please contact ARICT directly.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.templateId,
        {
          to_email: ARICT_OFFICIAL_EMAIL,
          from_name: form.studentName,
          reply_to: form.studentEmail,
          student_name: form.studentName,
          student_email: form.studentEmail,
          subject_code: form.subjectCode,
          subject_name: form.subjectName,
          department: form.department,
          exam_year: form.examYear,
          message: form.message || "No additional details provided.",
        },
        { publicKey: emailJsConfig.publicKey },
      );

      setStatus({
        type: "success",
        message:
          "Your paper request has been sent. ARICT will review it and get back to you.",
      });
      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.text ||
          error?.message ||
          "Failed to send your request. Please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="request-modal-overlay"
      role="presentation"
      onClick={handleClose}
    >
      <div
        className="request-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-paper-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="request-modal-header">
          <div>
            <h2 id="request-paper-title" className="text-headline-sm">
              Request a Paper
            </h2>
            <p className="text-body-md request-modal-subtitle">
              Submit details for a missing past paper.
            </p>
          </div>
          <button
            type="button"
            className="icon-btn request-modal-close"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close request form"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <p className="text-body-md request-modal-intro">
          Cannot find a past paper? Submit a request and the ARICT team at{" "}
          <a href={`mailto:${ARICT_OFFICIAL_EMAIL}`}>{ARICT_OFFICIAL_EMAIL}</a>{" "}
          will review it.
        </p>

        <form className="request-modal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="studentName">Your Name *</label>
              <input
                id="studentName"
                name="studentName"
                className="input-field"
                value={form.studentName}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="studentEmail">Your Email *</label>
              <input
                id="studentEmail"
                name="studentEmail"
                type="email"
                className="input-field"
                value={form.studentEmail}
                onChange={handleChange}
                placeholder="ict20*****@rjt.ac.lk"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="subjectCode">Subject Code *</label>
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
              <label htmlFor="subjectName">Subject Name *</label>
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
              <label htmlFor="examYear">Examination Period *</label>
              <input
                id="examYear"
                name="examYear"
                className="input-field"
                value={form.examYear}
                onChange={handleChange}
                placeholder="October | November 2025"
                required
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="message">Additional Details</label>
              <textarea
                id="message"
                name="message"
                className="input-field"
                value={form.message}
                onChange={handleChange}
                placeholder="Any extra information that may help us locate the paper..."
                rows={4}
              />
            </div>
          </div>

          {status.type !== "idle" && (
            <div className={`form-status form-status--${status.type}`}>
              {status.message}
            </div>
          )}

          <div className="request-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
