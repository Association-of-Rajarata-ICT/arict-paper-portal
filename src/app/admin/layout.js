import AdminShell from "./AdminShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/admin", {
  title: "Admin",
  description: "Sign in to the ARICT administration area to maintain the Rajarata University past paper archive, update paper details and manage contributions.",
  noIndex: true,
});

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
