import Link from "next/link";
import RequestPaperButton from "@/components/RequestPaperButton";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/request-or-contribute");

export default function RequestOrContributePage() {
  return (
    <section className="about-page" id="request-or-contribute-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">Request or contribute a paper</h1>
          <p className="text-body-lg">
            The archive grows through students. Ask for a paper you can&rsquo;t find, or share
            one you have so the next batch doesn&rsquo;t have to look for it.
          </p>
        </div>

        <div className="paper-choice">
          <section className="paper-choice-card" aria-labelledby="request-heading">
            <span className="paper-choice-icon" aria-hidden="true">
              <span className="material-symbols-outlined">note_add</span>
            </span>
            <h2 id="request-heading">Request a paper</h2>
            <p>
              Can&rsquo;t find the paper you need? Tell us which one, and the ARICT team will try
              to find it and add it to the archive.
            </p>
            <ul>
              <li>Give the course code and name, and the exam year if you know it.</li>
              <li>Search the archive first: older papers are sometimes filed under an old code.</li>
              <li>We reply to the email address you give us.</li>
            </ul>
            <RequestPaperButton className="btn btn-primary btn-lg">Request a paper</RequestPaperButton>
          </section>

          <section className="paper-choice-card" aria-labelledby="contribute-heading">
            <span className="paper-choice-icon" aria-hidden="true">
              <span className="material-symbols-outlined">upload_file</span>
            </span>
            <h2 id="contribute-heading">Contribute a paper</h2>
            <p>
              Have a past paper that isn&rsquo;t in the archive? Upload the PDF and it will help
              every student who sits that course after you.
            </p>
            <ul>
              <li>Upload official examination papers as PDF files.</li>
              <li>An ARICT admin checks every paper before it goes live.</li>
              <li>Please don&rsquo;t upload answer scripts or anything with personal details.</li>
            </ul>
            <Link href="/contribute" className="btn btn-primary btn-lg">
              <span className="material-symbols-outlined" aria-hidden="true">
                upload_file
              </span>
              Contribute a paper
            </Link>
          </section>
        </div>
      </div>
    </section>
  );
}
