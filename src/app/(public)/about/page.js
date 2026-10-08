import { getAboutStats } from "@/lib/server/aboutStats";
import RequestPaperButton from "@/components/RequestPaperButton";

// Always read fresh stats from Neon (admin updates must show without redeploy)
export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us | ARICT Past Paper Portal",
  description:
    "Learn about the Association of Rajarata Information & Communication Technology (ARICT) and our mission to provide academic resources.",
};

const features = [
  {
    title: "Our Mission",
    description:
      "The Association of Rajarata Information & Communication Technology (ARICT) is dedicated to advancing ICT education and fostering academic excellence. Our Past Paper Portal provides students with easy access to comprehensive examination archives, supporting their preparation and academic growth.",
  },
  {
    title: "Academic Resource Hub",
    description:
      "We curate and organize past examination papers across multiple departments, ensuring students have access to high-quality study materials. Each paper is categorized by department, subject code, academic year, and semester for effortless navigation.",
  },
  {
    title: "Community Driven",
    description:
      "ARICT brings together students, faculty, and industry partners to build a vibrant ICT community. Our portal is maintained by dedicated volunteers and faculty members who believe in open access to educational resources.",
  },
  {
    title: "Quality Assured",
    description:
      "Every paper in our archive undergoes verification to ensure accuracy and completeness. We work closely with university departments to maintain an up-to-date repository that reflects the current curriculum and examination standards.",
  },
];

export default async function AboutPage() {
  let stats = [
    { number: "0", label: "Past Papers" },
    { number: "0", label: "Subjects Covered" },
    { number: "5", label: "Departments" },
    { number: "—", label: "Active Students" },
  ];

  try {
    const data = await getAboutStats();
    stats = data.display;
  } catch {
    // Keep fallback stats if database is unavailable
  }

  return (
    <section className="about-page" id="about-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">About ARICT Portal</h1>
          <p className="text-body-lg">
            Empowering students with comprehensive academic resources. The ARICT
            Past Paper Portal is your gateway to years of examination archives,
            thoughtfully organized for the Rajarata University community.
          </p>
        </div>

        <dl className="about-register" aria-label="Archive in numbers">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.number}</dd>
            </div>
          ))}
        </dl>

        <div className="about-sections">
          {features.map((feature) => (
            <section key={feature.title} className="about-section">
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </section>
          ))}
        </div>

        <div className="about-cta">
          <div>
            <h2>Missing a past paper?</h2>
            <p>Tell ARICT which paper you need and the team will look for it.</p>
          </div>
          <RequestPaperButton className="btn btn-secondary btn-lg" />
        </div>
      </div>
    </section>
  );
}
