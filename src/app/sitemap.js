import { PUBLIC_PAGES, SITE_URL } from "@/lib/seo";
import { getPublicPapers } from "@/lib/server/publicPapers";
import { COURSES } from "@/data/curriculum";
import { otherCourses, papersForCourse } from "@/lib/curriculum";
import { mergeSharedPapers } from "@/lib/papers";

// Cached so Googlebot always gets a fast, complete response instead of a per-request database build.
export const revalidate = 3600;

// The newest change among these papers, if any of them has a date.
function lastModified(papers) {
  const times = papers.map((paper) => Date.parse(paper.updatedAt || paper.createdAt)).filter(Number.isFinite);
  return times.length ? { lastModified: new Date(Math.max(...times)) } : {};
}

// Next.js serves this metadata route as /sitemap.xml; no public/sitemap.xml is needed.
export default async function sitemap() {
  // No lastModified unless it is a real content date: Google ignores dates that change on every read.
  const pages = Object.keys(PUBLIC_PAGES).map((path) => ({ url: new URL(path, SITE_URL).href }));
  try {
    const papers = await getPublicPapers();
    const courses = [
      ...COURSES.map(({ code }) => ({ code, papers: papersForCourse(papers, code) })),
      ...otherCourses(papers).courses,
    ]
      .filter((course) => course.papers.length > 0)
      .map((course) => ({ url: `${SITE_URL}/search?course=${course.code}`, ...lastModified(course.papers) }));
    // A paper shared by several departments is stored once per department; list it once.
    return [...pages, ...courses, ...mergeSharedPapers(papers).map((paper) => ({
      url: `${SITE_URL}/paper/${encodeURIComponent(paper.docId || paper.id)}`,
      ...lastModified([paper]),
    }))];
  } catch {
    console.error("The sitemap could not load paper URLs; serving public pages only.");
    return pages;
  }
}
