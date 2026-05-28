"use client";

import { useState } from "react";
import PaperForm from "@/components/admin/PaperForm";
import { createPaper } from "@/lib/papers";

const initialForm = {
  subjectCode: "",
  subjectName: "",
  instructor: "",
  year: "",
  semester: "",
  department: "",
  driveLink: "",
};

export default function AddPaperPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    if (
      !form.subjectCode ||
      !form.subjectName ||
      !form.year ||
      !form.semester ||
      !form.department
    ) {
      setStatus({
        type: "error",
        message:
          "Subject code, subject name, department, year, and semester are required.",
      });
      return;
    }
    if (!selectedFile) {
      setStatus({ type: "error", message: "Please select a PDF file." });
      return;
    }

    setSubmitting(true);
    try {
      await createPaper(form, selectedFile);
      setStatus({ type: "success", message: "Paper added successfully." });
      setForm(initialForm);
      setSelectedFile(null);
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Failed to add paper.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-page" id="add-paper-page">
      <div className="admin-page-header">
        <div>
          <h1 className="text-headline-lg">Add Paper</h1>
          <p className="text-body-md">
            Upload a new past paper to Google Drive and save metadata in Neon.
          </p>
        </div>
      </div>

      <PaperForm
        form={form}
        onChange={handleChange}
        onFileChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        onSubmit={handleSubmit}
        submitLabel="Add Paper"
        submitting={submitting}
        status={status}
        requireFile
        selectedFile={selectedFile}
      />
    </section>
  );
}
