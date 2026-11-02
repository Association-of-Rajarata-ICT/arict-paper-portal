import emailjs from "@emailjs/browser";
import { ARICT_OFFICIAL_EMAIL } from "@/lib/constants";

// EmailJS sends mail straight from the browser to ARICT's mailbox. The IDs are public by design.
const config = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "",
  requestTemplateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
  submissionTemplateId: process.env.NEXT_PUBLIC_EMAILJS_SUBMISSION_TEMPLATE_ID || "",
  // Optional second EmailJS account for submission alerts (the free plan allows 2 templates and
  // 200 emails a month per account). Falls back to the main account's service and key.
  submissionServiceId: process.env.NEXT_PUBLIC_EMAILJS_SUBMISSION_SERVICE_ID || "",
  submissionPublicKey: process.env.NEXT_PUBLIC_EMAILJS_SUBMISSION_PUBLIC_KEY || "",
};

export const isEmailConfigured = Boolean(config.serviceId && config.publicKey && config.requestTemplateId);

function send(templateId, params, { serviceId = config.serviceId, publicKey = config.publicKey } = {}) {
  return emailjs.send(serviceId, templateId, { to_email: ARICT_OFFICIAL_EMAIL, ...params }, { publicKey });
}

export function sendPaperRequestEmail(params) {
  return send(config.requestTemplateId, params);
}

// Tells ARICT a student uploaded a paper. Uses the submission template when it is set up;
// until then it falls back to the paper-request template so the alert still arrives.
export function sendSubmissionEmail(submission) {
  const reviewLink = `${window.location.origin}/admin/submissions?id=${encodeURIComponent(submission.id)}`;
  const academic = `Year ${submission.year}, Semester ${submission.semester}`;

  if (config.submissionTemplateId) {
    return send(config.submissionTemplateId, {
      from_name: submission.submitterName,
      reply_to: submission.submitterEmail,
      submitter_name: submission.submitterName,
      submitter_email: submission.submitterEmail,
      subject_code: submission.subjectCode,
      subject_name: submission.subjectName,
      department: submission.department,
      academic_year: academic,
      exam_period: submission.examPeriod,
      file_name: submission.fileName,
      notes: submission.notes || "No notes.",
      review_link: reviewLink,
    }, {
      serviceId: config.submissionServiceId || config.serviceId,
      publicKey: config.submissionPublicKey || config.publicKey,
    });
  }

  return send(config.requestTemplateId, {
    from_name: submission.submitterName,
    reply_to: submission.submitterEmail,
    student_name: submission.submitterName,
    student_email: submission.submitterEmail,
    subject_code: submission.subjectCode,
    subject_name: submission.subjectName,
    department: submission.department,
    exam_year: submission.examPeriod,
    message: [
      "NEW PAST PAPER SUBMITTED — pending review (this is an upload, not a request).",
      `Review it: ${reviewLink}`,
      `${academic} · File: ${submission.fileName}`,
      submission.notes ? `Notes: ${submission.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
