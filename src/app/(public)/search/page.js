import SearchClient from "./SearchClient";
import { pageMetadata } from "@/lib/seo";
import { getPublicPapers } from "@/lib/server/publicPapers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  // Keep the main archive indexable without indexing arbitrary search combinations.
  return pageMetadata("/search", { noIndex: Object.keys(params).length > 0 });
}

export default async function SearchPage() {
  let papers = null;
  try {
    papers = await getPublicPapers();
  } catch {
    console.error("The search page could not load the paper archive.");
  }
  return <SearchClient initialPapers={papers} />;
}
