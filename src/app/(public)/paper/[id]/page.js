import { notFound, permanentRedirect } from "next/navigation";
import PaperDetailClient from "./PaperDetailClient";
import { getPaperRouteId } from "@/lib/papers";
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
  try {
    relatedPapers = (await getPublicPapers()).filter(
      (item) => item.department === paper.department && item.id !== paper.id
    ).slice(0, 3);
  } catch {
    console.error("Related papers are temporarily unavailable.");
  }
  return <PaperDetailClient paper={paper} relatedPapers={relatedPapers} />;
}
