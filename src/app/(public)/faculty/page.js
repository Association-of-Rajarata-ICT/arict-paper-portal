import Link from "next/link";
import { departments } from "@/data/departments";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/faculty");

export default function FacultyPage() {
  return (
    <section className="about-page faculty-page" id="faculty-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">Faculty of Applied Sciences</h1>
          <p className="text-body-lg">
            Browse available past examination papers for the five departments of
            the Faculty of Applied Sciences at Rajarata University of Sri Lanka.
            ARICT volunteers organise the archive for students' revision.
          </p>
        </div>
        <div className="about-sections" style={{ marginTop: 0 }}>
          {departments.map((department) => (
            <section key={department.id} className="about-section">
              <h2>{department.name}</h2>
              <p>{department.description}</p>
              <p><Link href={"/search?q=" + encodeURIComponent(department.name)}>
                Browse {department.name} past papers
              </Link></p>
            </section>
          ))}
        </div>
        <p className="legal-note">
          Availability varies by subject and examination period. Read our{" "}
          <Link href="/help">guide to finding past papers</Link> or{" "}
          <Link href="/contact">contact ARICT about a missing paper</Link>.
        </p>
      </div>
    </section>
  );
}
