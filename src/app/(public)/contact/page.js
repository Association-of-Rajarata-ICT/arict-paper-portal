import { pageMetadata } from "@/lib/seo";
import RequestPaperButton from "@/components/RequestPaperButton";
import { ARICT_OFFICIAL_EMAIL, ARICT_SOCIAL_LINKS } from "@/lib/constants";

export const metadata = pageMetadata("/contact");

const channels = [
  { label: "GitHub", href: ARICT_SOCIAL_LINKS.github, text: "Association-of-Rajarata-ICT" },
  { label: "LinkedIn", href: ARICT_SOCIAL_LINKS.linkedin, text: "ARICT on LinkedIn" },
  { label: "Facebook", href: ARICT_SOCIAL_LINKS.facebook, text: "arict.rjt" },
  { label: "Instagram", href: ARICT_SOCIAL_LINKS.instagram, text: "@arict.rjt" },
];

export default function ContactPage() {
  return (
    <section className="about-page" id="contact-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">Contact ARICT</h1>
          <p className="text-body-lg">
            Questions about the portal, a paper to report or contribute, or
            ideas for ARICT? Reach the team through any of the channels below.
          </p>
        </div>

        <div className="about-sections">
          <section className="about-section">
            <h2>Email</h2>
            <p>
              For corrections, paper contributions and general enquiries, write
              to{" "}
              <a href={`mailto:${ARICT_OFFICIAL_EMAIL}`}>
                {ARICT_OFFICIAL_EMAIL}
              </a>
              . Include the paper&apos;s link or subject code where relevant so
              we can help faster.
            </p>
          </section>

          <section className="about-section">
            <h2>Who we are</h2>
            <p>
              ARICT is the Association of Rajarata Information &amp;
              Communication Technology, a student association at Rajarata
              University of Sri Lanka. The portal is run by volunteers, so
              replies may take a few days.
            </p>
          </section>

          <section className="about-section">
            <h2>Follow ARICT</h2>
            <ul className="contact-list">
              {channels.map((channel) => (
                <li key={channel.label}>
                  <span>{channel.label}</span>
                  <a href={channel.href} target="_blank" rel="noreferrer">
                    {channel.text}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="about-section">
            <h2>Looking for a paper?</h2>
            <p>
              The quickest route is the request form. It sends the subject
              code, department and exam year straight to the team.
            </p>
            <p>
              <RequestPaperButton className="btn btn-primary" />
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
