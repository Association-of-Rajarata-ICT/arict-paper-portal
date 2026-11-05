import { PUBLIC_PAGES, SITE_URL } from "@/lib/seo";
import { getPublicPapers } from "@/lib/server/publicPapers";
import { COURSES } from "@/data/curriculum";
import { papersForCourse } from "@/lib/curriculum";

export const dynamic = "force-dynamic";

// Next.js serves this metadata route as /sitemap.xml; no public/sitemap.xml is needed.
export default async function sitemap() {
  const pages = Object.keys(PUBLIC_PAGES).map((path) => ({ url: new URL(path, SITE_URL).href }));
  try {
    const papers = await getPublicPapers();
    const courses = COURSES.filter((course) => papersForCourse(papers, course.code).length > 0)
      .map((course) => ({ url: `${SITE_URL}/courses/${course.code}` }));
    return [...pages, ...courses, ...papers.map((paper) => ({
      url: `${SITE_URL}/paper/${encodeURIComponent(paper.docId || paper.id)}`,
      ...(paper.updatedAt || paper.createdAt ? { lastModified: paper.updatedAt || paper.createdAt } : {}),
    }))];
  } catch {
    console.error("The sitemap could not load paper URLs; serving public pages only.");
    return pages;
  }
}
