import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { listSubmissions } from "@/lib/server/submissionsRepository";

const STATUSES = ["pending", "approved", "rejected"];

export async function GET(request) {
  try {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const status = new URL(request.url).searchParams.get("status") || "pending";
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ message: "Unknown status." }, { status: 400 });
    }
    return NextResponse.json({ submissions: await listSubmissions(status) });
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Failed to load submissions." },
      { status: 500 }
    );
  }
}
