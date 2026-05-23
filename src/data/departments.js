export const departments = [
  {
    id: "biological-sciences",
    name: "Biological Sciences",
    icon: "biotech",
    paperCount: null,
    courseCount: null,
    description:
      "Study resources focused on life sciences, genetics, ecology, and related fields.",
  },
  {
    id: "chemical-sciences",
    name: "Chemical Sciences",
    icon: "science",
    paperCount: null,
    courseCount: null,
    description:
      "Explore chemistry-focused materials across analytical, organic, and physical chemistry.",
  },
  {
    id: "computing",
    name: "Computing",
    icon: "computer",
    paperCount: null,
    courseCount: null,
    description:
      "Find papers covering programming, software engineering, databases, and systems.",
  },
  {
    id: "health-promotion",
    name: "Health Promotion",
    icon: "health_and_safety",
    paperCount: null,
    courseCount: null,
    description:
      "Resources on community health, well-being, and public health initiatives.",
  },
  {
    id: "physical-sciences",
    name: "Physical Sciences",
    icon: "travel_explore",
    paperCount: null,
    courseCount: null,
    description:
      "Study materials spanning physics, earth sciences, and broader physical science topics.",
  },
];

export function getDepartmentById(id) {
  return departments.find((d) => d.id === id);
}
