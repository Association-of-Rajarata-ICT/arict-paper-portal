import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import RequestPaperButton from "@/components/RequestPaperButton";
import { ARICT_OFFICIAL_EMAIL } from "@/lib/constants";

export const metadata = pageMetadata("/help");

const faqGroups = [
  {
    title: "Finding papers",
    items: [
      {
        q: "How do I find a past paper?",
        a: "Use the search bar on the home page, or open a department from the footer or the home page. On the results page you can narrow papers by department, academic year, semester and exam period, and sort them by newest or oldest.",
      },
      {
        q: "What can I search by?",
        a: "Subject name, subject code, or department. Partial matches work, so a few letters of the code or title are usually enough.",
      },
      {
        q: "Which departments are covered?",
        a: "Biological Sciences, Chemical Sciences, Computing, Health Promotion and Physical Sciences. Coverage within each department depends on the papers students and staff have shared with ARICT, so some years or subjects may still be missing.",
      },
    ],
  },
  {
    title: "Using papers",
    items: [
      {
        q: "Do I need an account?",
        a: "No. The portal is open to everyone. There is nothing to sign up for and no login for students.",
      },
      {
        q: "How do I view or download a paper?",
        a: "Open a paper from the results list to see its details and a preview. From there you can open or download the PDF, and copy a link to share it with classmates.",
      },
      {
        q: "Are these the official papers?",
        a: "Papers are collected and organised by ARICT volunteers as a study aid. They are not issued by the university. Always confirm the current syllabus and exam format with your department.",
      },
    ],
  },
  {
    title: "Something missing or wrong",
    items: [
      {
        q: "A paper I need is not listed. What can I do?",
        a: "Use the Request a paper button and tell us the subject code, subject name, department and exam year. The ARICT team will try to find it and add it.",
      },
      {
        q: "I found a wrong title, year or file. How do I report it?",
        a: `Send us the paper's link and a short note on what is wrong at ${ARICT_OFFICIAL_EMAIL}, and we will correct it.`,
      },
      {
        q: "Can I contribute papers?",
        a: "Yes. If you have a past paper that is not on the portal, get in touch through the Contact page and the team will arrange how to add it.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <section className="about-page" id="help-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">Help Center</h1>
          <p className="text-body-lg">
            Quick answers about finding and using past papers on the ARICT
            portal. Cannot find what you need?{" "}
            <Link href="/contact">Contact the team</Link>.
          </p>
        </div>

        <div className="faq">
          {faqGroups.map((group) => (
            <section key={group.title} className="faq-group">
              <h2>{group.title}</h2>
              {group.items.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </section>
          ))}
        </div>

        <div className="about-cta">
          <div>
            <h2>Still missing a paper?</h2>
            <p>Tell ARICT which paper you need and the team will look for it.</p>
          </div>
          <RequestPaperButton className="btn btn-secondary btn-lg" />
        </div>
      </div>
    </section>
  );
}
