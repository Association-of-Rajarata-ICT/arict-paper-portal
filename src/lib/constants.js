import { departments } from "@/data/departments";

export const DEPARTMENT_NAMES = departments.map((dept) => dept.name);

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/add-paper", label: "Add Paper", icon: "add_circle" },
  { href: "/admin/papers", label: "Manage Papers", icon: "description" },
];
