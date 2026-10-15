import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import {
  getPortalStatsForAdmin,
  setActiveStudentsCount,
} from "@/lib/server/aboutStats";

export async function GET(request) {
  try {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const stats = await getPortalStatsForAdmin();
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load portal stats." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const activeStudentsCount = body?.activeStudentsCount;

    const stats = await getPortalStatsForAdmin();
    if (!stats.activeStudentsEditable) {
      return NextResponse.json(
        {
          message:
            "Active students is controlled by ACTIVE_STUDENTS_COUNT in environment variables. Remove it from Vercel to edit here.",
        },
        { status: 400 }
      );
    }

    await setActiveStudentsCount(activeStudentsCount);
    revalidatePath("/about");
    const updated = await getPortalStatsForAdmin();

    return NextResponse.json({ stats: updated });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to update portal stats." },
      { status: 500 }
    );
  }
}
