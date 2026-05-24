import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }) {
  return (
    <div className="public-shell">
      <Header />
      <main style={{ flexGrow: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
