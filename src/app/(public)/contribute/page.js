import ContributeForm from "./ContributeForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/contribute");

export default function ContributePage() {
  return (
    <section className="about-page" id="contribute-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">Contribute a paper</h1>
          <p className="text-body-lg">
            Have a past paper that isn&rsquo;t in the archive? Upload the PDF
            here. The ARICT team checks every submission before it goes live,
            so fill in the details as accurately as you can.
          </p>
        </div>

        <div className="contribute-layout">
          <ContributeForm />

          <aside className="contribute-steps" aria-labelledby="contribute-steps-heading">
            <h2 id="contribute-steps-heading">What happens next</h2>
            <ol>
              <li>Your PDF is stored privately in a review queue.</li>
              <li>An ARICT admin checks the paper and corrects any details.</li>
              <li>Once approved, it appears in the archive for every student.</li>
            </ol>
            <p>
              Only upload official examination papers. Please don&rsquo;t
              upload answer scripts or anything with personal details on it.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
