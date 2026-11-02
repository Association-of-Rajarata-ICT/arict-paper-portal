import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getPaperById, listPapers, PAPERS_CACHE_TAG } from "@/lib/server/papersRepository";

// The whole archive is ~1 MB. Reading it from Neon on every page view burned through the
// free plan's monthly transfer, so the list is cached on the server and re-read at most once
// every PAPERS_CACHE_SECONDS (3 hours = at most ~8 MB a day, ~0.25 GB a month). Admin edits
// clear it at once (see papersRepository.js); changes made straight in the database or by the
// sync scripts show up when the cache expires.
export const PAPERS_CACHE_SECONDS = 3 * 60 * 60;

const loadPapers = unstable_cache(() => listPapers(), ["public-papers"], {
  revalidate: PAPERS_CACHE_SECONDS,
  tags: [PAPERS_CACHE_TAG],
});

// Also shared between metadata and page rendering within the same request.
export const getPublicPapers = cache(() => loadPapers());
export const getPublicPaper = cache((id) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  return getPaperById(id);
});
