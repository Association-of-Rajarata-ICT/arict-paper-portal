import { PUBLIC_PAGES, SITE_URL } from "@/lib/seo";
import { getPublicPapers } from "@/lib/server/publicPapers";

export const dynamic = "force-dynamic";

// Next.js serves this metadata route as /sitemap.xml; no public/sitemap.xml is needed.
export default async function sitemap() {
  const pages = Object.keys(PUBLIC_PAGES).map((path) => ({ url: new URL(path, SITE_URL).href }));
  try {
    const papers = await getPublicPapers();
    return [...pages, ...papers.map((paper) => ({
      url: `${SITE_URL}/paper/${encodeURIComponent(paper.docId || paper.id)}`,
      ...(paper.updatedAt || paper.createdAt ? { lastModified: paper.updatedAt || paper.createdAt } : {}),
    }))];
  } catch {
    console.error("The sitemap could not load paper URLs; serving public pages only.");
    return pages;
  }
}
