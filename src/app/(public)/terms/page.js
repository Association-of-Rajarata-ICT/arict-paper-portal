import Link from "next/link";
import { ARICT_OFFICIAL_EMAIL } from "@/lib/constants";

export const metadata = {
  title: "Terms of Use | ARICT Past Paper Portal",
  description:
    "The terms for using the ARICT Past Paper Portal, a student-run archive of past examination papers.",
};

const sections = [
  {
    title: "About the portal",
    body: [
      "The ARICT Past Paper Portal is run by volunteers of the Association of Rajarata Information & Communication Technology to help students prepare for examinations. By using it you agree to these terms.",
    ],
  },
  {
    title: "Study use only",
    body: [
      "Papers are provided for personal, non-commercial study. Please do not sell the papers or republish them in bulk. Copyright in the original papers remains with Rajarata University of Sri Lanka and the relevant examiners.",
    ],
  },
  {
    title: "No guarantee of accuracy",
    body: [
      "Papers are collected from students and staff and may be incomplete, mislabelled or out of date. They are not official university documents, and past papers do not predict future exams. Confirm the current syllabus and exam format with your department.",
      "The portal is provided as is, without warranty, and may be unavailable or change without notice. ARICT is not liable for losses arising from its use.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "Do not attempt to disrupt the portal, scrape it aggressively, access the admin area or upload harmful content. Use the paper request form honestly and only to ask for papers.",
    ],
  },
  {
    title: "Contributions and takedowns",
    body: [
      "If you share a paper with ARICT you confirm you are allowed to do so. If you are a rights holder and want a paper removed or corrected, email us and we will review it promptly.",
    ],
  },
  {
    title: "Changes and contact",
    body: [
      `We may update these terms; continued use means you accept the latest version. Questions: ${ARICT_OFFICIAL_EMAIL}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="about-page" id="terms-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">Terms of Use</h1>
          <p className="text-body-lg">
            The ground rules for using the ARICT Past Paper Portal. Last
            updated: 30 October 2026.
          </p>
        </div>

        <div className="about-sections about-sections--single">
          {sections.map((section) => (
            <section key={section.title} className="about-section">
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        <p className="legal-note">
          See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </section>
  );
}
