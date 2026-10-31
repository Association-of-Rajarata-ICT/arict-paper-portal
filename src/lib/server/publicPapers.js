import { cache } from "react";
import { getPaperById, listPapers } from "@/lib/server/papersRepository";

// Share reads between metadata and page rendering within the same request.
export const getPublicPapers = cache(() => listPapers());
export const getPublicPaper = cache((id) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  return getPaperById(id);
});
