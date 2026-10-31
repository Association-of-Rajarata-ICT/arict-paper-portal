export const SITE_NAME = "ARICT Past Paper Portal";
export const SITE_URL = "https://papers.arict.lk";
export const OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  alt: "ARICT Past Paper Portal — Faculty of Applied Sciences, Rajarata University of Sri Lanka",
};

export const PUBLIC_PAGES = {
  "/": {
    title: "Home",
    description: "Find Rajarata University Applied Sciences past papers by subject, department, year and semester. Preview, download or request papers with ARICT.",
  },
  "/search": {
    title: "Past Papers",
    description: "Browse and search Rajarata University past exam papers. Filter by department, academic year and semester, then preview or download your paper.",
  },
  "/about": {
    title: "About ARICT",
    description: "Learn about ARICT, the student association behind Rajarata University's past paper archive, and how volunteers help students prepare for exams.",
  },
  "/faculty": {
    title: "Faculty of Applied Sciences",
    description: "Explore the five Applied Sciences departments at Rajarata University and find their available past exam papers in the ARICT student-run archive.",
  },
  "/help": {
    title: "Help Center",
    description: "Learn how to search, preview, download and share past papers on the ARICT portal, request missing papers, and report incorrect paper details.",
  },
  "/contact": {
    title: "Contact ARICT",
    description: "Contact the ARICT team at Rajarata University to contribute past papers, report corrections, ask about the portal or connect through social media.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "Read how the ARICT Past Paper Portal handles paper request details, browser preferences and third-party services, and how to contact the team.",
  },
  "/terms": {
    title: "Terms of Use",
    description: "Read the ARICT Past Paper Portal's terms for personal study, responsible use, paper contributions and corrections, with contact details for queries.",
  },
};

export const MAIN_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Past Papers" },
  { href: "/faculty", label: "Faculty" },
  { href: "/about", label: "About ARICT" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
];

export function pageMetadata(path, overrides = {}) {
  const { title, description, noIndex = false } = { ...PUBLIC_PAGES[path], ...overrides };
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = new URL(path, SITE_URL).href;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_LK",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

function shorten(value, length) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length <= length ? text : `${text.slice(0, length - 1).trimEnd()}…`;
}

export function paperMetadata(paper) {
  const title = [paper.courseCode, paper.title, paper.examPeriod].filter(Boolean).join(" — ");
  const code = shorten(paper.courseCode, 12);
  const period = shorten(paper.examPeriod || "past examination", 24);
  const suffix = ` (${period}). Download this Rajarata University past paper from ARICT, with exam details and related papers.`;
  const prefix = `Preview ${code} `;
  let description = `${prefix}${shorten(paper.title, 155 - prefix.length - suffix.length)}${suffix}`;
  if (description.length < 120) description += " Prepare for your exams.";
  return pageMetadata(`/paper/${encodeURIComponent(paper.docId || paper.id)}`, { title, description });
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
