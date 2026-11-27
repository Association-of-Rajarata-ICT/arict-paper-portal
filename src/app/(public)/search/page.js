import SearchClient from "./SearchClient";
import { pageMetadata } from "@/lib/seo";
import { getPublicPapers } from "@/lib/server/publicPapers";
import { courseView, formatCourseCode, recordsForCode } from "@/lib/curriculum";
import { packPapers } from "@/lib/paperPayload";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  // A course view (?course=ICT3301) is a real page of its own: title it and let it be indexed.
  if (params.course && Object.keys(params).length === 1) {
    const view = await getPublicPapers().then((papers) => courseView(papers, params.course)).catch(() => null);
    if (view) {
      const name = `${formatCourseCode(view.code)} ${view.title}`;
      return pageMetadata(`/search?course=${view.code}`, {
        title: `${name} Past Papers`,
        description: `All ${name} past papers in the ARICT archive, newest first. Preview, download one, or download every Rajarata University paper as a zip.`,
      });
    }
  }
  // Keep the main archive indexable without indexing arbitrary search combinations.
  return pageMetadata("/search", { noIndex: Object.keys(params).length > 0 });
}

export default async function SearchPage({ searchParams }) {
  const { course } = await searchParams;
  let papers = null;
  try {
    papers = await getPublicPapers();
  } catch {
    console.error("The search page could not load the paper archive.");
  }
  // A course page only needs its own papers. The key remounts the client when the visitor moves
  // between a course page and the full archive, so it never keeps the shorter list.
  const view = papers && typeof course === "string" ? courseView(papers, course) : null;
  const shown = view ? recordsForCode(papers, view.code) : papers;
  return <SearchClient key={view?.code || "all"} initialRows={shown && packPapers(shown)} />;
}
