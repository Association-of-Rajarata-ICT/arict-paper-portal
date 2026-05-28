"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PaperForm from "@/components/admin/PaperForm";
import {
  fetchPaperById,
  paperToForm,
  updatePaper,
} from "@/lib/papers";

export default function EditPaperPage() {
  const params = useParams();
  const departmentParam = decodeURIComponent(params.department || "");
  const docId = decodeURIComponent(params.id || "");

  const [form, setForm] = useState({
    subjectCode: "",
    subjectName: "",
    instructor: "",
    year: "",
    semester: "",
    department: "",
    driveLink: "",
  });
  const [originalDepartment, setOriginalDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [notFound, setNotFound] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!departmentParam || !docId) return;
      setLoading(true);
      try {
        const paper = await fetchPaperById(departmentParam, docId);
        if (!isMounted) return;

        if (!paper) {
          setNotFound(true);
          return;
        }

        setForm(paperToForm(paper));
        setOriginalDepartment(paper.departmentFull || paper.department);
      } catch (error) {
        if (isMounted) {
          setStatus({
            type: "error",
            message: error?.message || "Failed to load paper.",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [departmentParam, docId]);

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

    setSubmitting(true);
    try {
      await updatePaper(departmentParam, docId, form, originalDepartment, selectedFile);
      setOriginalDepartment(form.department);
      if (selectedFile) {
        setForm((prev) => ({ ...prev, driveLink: "" }));
      }
      setSelectedFile(null);
      setStatus({ type: "success", message: "Paper updated successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Failed to update paper.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="admin-page">
        <h1 className="text-headline-lg">Loading...</h1>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="admin-page">
        <h1 className="text-headline-lg">Paper Not Found</h1>
        <p className="text-body-md">The requested paper could not be loaded.</p>
        <Link href="/admin/papers" className="btn btn-secondary">
          Back to Manage Papers
        </Link>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="text-headline-lg">Edit Paper</h1>
          <p className="text-body-md">
            Update paper details, folders, and optionally replace the uploaded PDF.
          </p>
        </div>
        <Link href="/admin/papers" className="btn btn-secondary">
          Back to Manage Papers
        </Link>
      </div>
      <PaperForm
        form={form}
        onChange={handleChange}
        onFileChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        submitting={submitting}
        status={status}
        requireFile={false}
      />
    </section>
  );
}
