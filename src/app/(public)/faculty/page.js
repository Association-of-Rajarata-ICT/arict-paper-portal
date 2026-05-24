export const metadata = {
  title: "Faculty | ARICT Past Paper Portal",
  description:
    "Meet the faculty and academic teams supporting the ARICT Past Paper Portal.",
};

export default function FacultyPage() {
  const highlights = [
    {
      title: "Department Representatives",
      description:
        "Faculty representatives from each department help curate and verify the latest past papers.",
    },
    {
      title: "Academic Coordinators",
      description:
        "Coordinators ensure the portal aligns with current curricula and assessment standards.",
    },
    {
      title: "Faculty Advisors",
      description:
        "Advisors guide portal improvements and support students with learning resources.",
    },
    {
      title: "Support Team",
      description:
        "A dedicated group handles updates, quality checks, and student feedback.",
    },
  ];

  return (
    <section className="about-page faculty-page" id="faculty-page">
      <div className="container">
        <div className="about-hero">
          <h1 className="text-headline-xl">Faculty</h1>
          <p className="text-body-lg">
            The ARICT Past Paper Portal is supported by faculty members and
            academic teams committed to quality, accuracy, and student success.
          </p>
        </div>

        <div className="about-grid" style={{ marginTop: "48px" }}>
          {highlights.map((item) => (
            <div key={item.title} className="about-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
