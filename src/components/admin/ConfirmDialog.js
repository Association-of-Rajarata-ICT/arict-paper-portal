"use client";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="admin-dialog-overlay" role="presentation" onClick={onCancel}>
      <div
        className="card admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-dialog-title" className="text-headline-sm">
          {title}
        </h2>
        <p className="text-body-md admin-dialog-message">{message}</p>
        <div className="admin-dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
