import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ARICT_OFFICIAL_EMAIL } from "@/lib/constants";

export const metadata = pageMetadata("/privacy");

const sections = [
  {
    title: "Summary",
    body: [
      "The portal does not require an account and does not ask visitors for personal information to browse, search or download past papers. We only receive personal details when you choose to send them to us, for example through the paper request form.",
    ],
  },
  {
    title: "Information you send us",
    body: [
      "When you submit the Request a paper form we receive your name, your email address, the paper details you enter (subject code, subject name, department, exam year) and any message you add. We use these only to find the paper, reply to you and see which papers are in demand.",
      "The form is delivered to ARICT's official mailbox through EmailJS, a third-party email service. Emails you send us directly are handled in the same mailbox.",
    ],
  },
  {
    title: "Information stored in your browser",
    body: [
      "The portal saves your light or dark theme choice in your browser's local storage so it is remembered next time. This stays on your device and is not sent to us.",
    ],
  },
  {
    title: "Files and hosting",
    body: [
      "Paper files are stored on Google Drive and paper details are stored in a database. Opening or downloading a paper may involve Google's services, which have their own privacy policy. Standard server logs (such as IP address and pages requested) may be kept by our hosting provider for security and reliability.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "We do not sell your information. We share it only with the service providers named above, which are needed to run the portal, or where the law requires it.",
    ],
  },
  {
    title: "Retention and your choices",
    body: [
      "Paper requests are kept only as long as needed to handle them. To ask what we hold about you, or to have it deleted, email us and we will respond as soon as we can.",
    ],
  },
  {
    title: "Changes and contact",
    body: [
      `We may update this policy as the portal changes. Questions can be sent to ${ARICT_OFFICIAL_EMAIL} or through our Contact page.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <section className="about-page" id="privacy-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">Privacy Policy</h1>
          <p className="text-body-lg">
            How the ARICT Past Paper Portal handles your information. Last
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
          See also our <Link href="/terms">Terms of Use</Link>.
        </p>
      </div>
    </section>
  );
}
