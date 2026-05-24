export const metadata = {
  title: "About Us | ARICT Past Paper Portal",
  description:
    "Learn about the Association of Rajarata Information & Communication Technology (ARICT) and our mission to provide academic resources.",
};

export default function AboutPage() {
  const stats = [
    { number: "3,760+", label: "Past Papers" },
    { number: "143", label: "Papers Covered" },
    { number: "4", label: "Departments" },
    { number: "5,000+", label: "Active Students" },
  ];

  const features = [
    {
      title: "Our Mission",
      description:
        "The Association of Rajarata Information & Communication Technology (ARICT) is dedicated to advancing ICT education and fostering academic excellence. Our Past Paper Portal provides students with easy access to comprehensive examination archives, supporting their preparation and academic growth.",
    },
    {
      title: "Academic Resource Hub",
      description:
        "We curate and organize thousands of past examination papers across multiple departments, ensuring students have access to high-quality study materials. Each paper is carefully categorized by department, subject code, academic year, and semester for effortless navigation.",
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

  return (
    <section className="about-page" id="about-page">
      <div className="container">
        {/* Hero */}
        <div className="about-hero">
          <h1 className="text-headline-xl">
            About ARICT Portal
          </h1>
          <p className="text-body-lg">
            Empowering students with comprehensive academic resources. The ARICT
            Past Paper Portal is your gateway to years of examination archives,
            thoughtfully organized for the Rajarata University community.
          </p>
        </div>

        {/* Stats */}
        <div className="about-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="about-stat">
              <div className="about-stat-number">{stat.number}</div>
              <div className="about-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="about-grid" style={{ marginTop: "80px" }}>
          {features.map((feature) => (
            <div key={feature.title} className="about-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
