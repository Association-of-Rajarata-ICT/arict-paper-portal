import HomeClient from "./HomeClient";
import { ARICT_SOCIAL_LINKS } from "@/lib/constants";
import { pageMetadata, PUBLIC_PAGES, serializeJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";
import { getPublicPapers } from "@/lib/server/publicPapers";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata("/");

export default async function HomePage() {
  let papers = null;
  try {
    papers = await getPublicPapers();
  } catch {
    console.error("The home page could not load the paper archive.");
  }
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: PUBLIC_PAGES["/"].description,
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Association of Rajarata Information & Communication Technology",
        alternateName: "ARICT",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo.png`,
        sameAs: Object.values(ARICT_SOCIAL_LINKS),
      },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
    <HomeClient initialPapers={papers} />
  </>;
}
