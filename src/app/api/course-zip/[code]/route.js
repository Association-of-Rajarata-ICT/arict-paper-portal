import { courseView, courseZipName, paperZipEntryName } from "@/lib/curriculum";
import { extractDriveId } from "@/lib/papers";
import { streamDriveFile } from "@/lib/server/drive";
import { getPublicPapers } from "@/lib/server/publicPapers";
import { createZipStream } from "@/lib/server/zip";

export const dynamic = "force-dynamic";
// Each paper is fetched from Drive while the zip streams out; large courses need the time.
export const maxDuration = 60;

// Every past paper of one course as a single zip: "ICT3301 Human Computer Interaction - Past Papers.zip".
export async function GET(_request, { params }) {
  const { code } = await params;
  const view = courseView(await getPublicPapers(), decodeURIComponent(code));
  const files = (view?.papers || [])
    .map((paper) => ({ paper, fileId: paper.driveFileId || extractDriveId(paper.driveLink) }))
    .filter(({ fileId }) => fileId);
  if (!files.length) {
    return Response.json({ message: "This course has no papers to download." }, { status: 404 });
  }

  const used = new Map();
  const entries = files.map(({ paper, fileId }) => {
    // Two papers from one sitting (Part I / Part II) would otherwise share a name.
    const base = paperZipEntryName(paper);
    const count = (used.get(base) || 0) + 1;
    used.set(base, count);
    const name = count === 1 ? base : base.replace(/\.pdf$/, ` (${count}).pdf`);
    return { name, open: () => streamDriveFile(fileId) };
  });

  const fileName = courseZipName(view);
  const asciiName = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return new Response(createZipStream(entries), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}
