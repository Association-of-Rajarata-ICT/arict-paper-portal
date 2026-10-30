import { departments } from "@/data/departments";

export const ARICT_OFFICIAL_EMAIL = "arict@as.rjt.ac.lk";

export const ARICT_SOCIAL_LINKS = {
  github: "https://github.com/Association-of-Rajarata-ICT",
  linkedin: "https://www.linkedin.com/company/arict/",
  facebook: "https://www.facebook.com/arict.rjt",
  instagram: "https://www.instagram.com/arict.rjt/",
};

export const DEPARTMENT_NAMES = departments.map((dept) => dept.name);

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/add-paper", label: "Add Paper", icon: "add_circle" },
  { href: "/admin/papers", label: "Manage Papers", icon: "description" },
];
