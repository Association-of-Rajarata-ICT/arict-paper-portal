import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavigationProgress from "@/components/NavigationProgress";

export default function PublicLayout({ children }) {
  return (
    <div className="public-shell">
      {/* useSearchParams needs a Suspense boundary so static pages still prerender. */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Header />
      <main id="main-content" className="public-main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
