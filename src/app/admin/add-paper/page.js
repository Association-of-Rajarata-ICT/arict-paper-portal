"use client";

import { useState } from "react";
import PaperForm from "@/components/admin/PaperForm";
import { createPaper } from "@/lib/papers";

const initialForm = {
  subjectCode: "",
  subjectName: "",
  instructor: "",
  year: "",
  department: "",
  driveLink: "",
};

export default function AddPaperPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    if (!form.subjectCode || !form.subjectName || !form.year || !form.department) {
      setStatus({
        type: "error",
        message: "Subject code, subject name, year, and department are required.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await createPaper(form);
      setStatus({ type: "success", message: "Paper added successfully." });
      setForm(initialForm);
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
    <section className="admin-page form-page" id="add-paper-page">
      <div className="form-header">
        <h1 className="text-headline-lg">Add Paper</h1>
        <p className="text-body-md">
          Add a new past paper to the selected Firestore department.
        </p>
      </div>

      <PaperForm
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel="Add Paper"
        submitting={submitting}
        status={status}
      />
    </section>
  );
}
