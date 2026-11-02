import { notFound, permanentRedirect } from "next/navigation";
import PaperDetailClient from "./PaperDetailClient";
import { getPaperRouteId, mergeSharedPapers } from "@/lib/papers";
import { paperMetadata, pageMetadata } from "@/lib/seo";
import { getPublicPaper, getPublicPapers } from "@/lib/server/publicPapers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const paper = await getPublicPaper(getPaperRouteId({ id }));
  if (!paper) return pageMetadata("/paper/" + encodeURIComponent(id), {
    title: "Paper Not Found",
    description: "This past paper is not in the ARICT archive. Search available Rajarata University examination papers or contact the team to request a missing paper.",
    noIndex: true,
  });
  return paperMetadata(paper);
}

export default async function PaperPage({ params }) {
  const { id } = await params;
  const canonicalId = getPaperRouteId({ id });
  const paper = await getPublicPaper(canonicalId);
  if (!paper) notFound();
  if (id !== canonicalId) permanentRedirect("/paper/" + encodeURIComponent(canonicalId));

  let relatedPapers = [];
  let departments = [paper.department];
  try {
    const merged = mergeSharedPapers(await getPublicPapers());
    const own = merged.find((item) => item.variants.some((variant) => variant.docId === paper.docId));
    if (own) departments = own.departments;
    relatedPapers = merged
      .filter((item) => item !== own && item.departments.includes(paper.department))
      .slice(0, 3);
  } catch {
    console.error("Related papers are temporarily unavailable.");
  }
  return <PaperDetailClient paper={{ ...paper, departments }} relatedPapers={relatedPapers} />;
}
