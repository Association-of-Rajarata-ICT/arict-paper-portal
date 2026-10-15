import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { getGoogleAuthUrl } from "@/lib/server/drive";

export async function GET(request) {
  try {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const url = getGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Google OAuth is not configured." },
      { status: 500 }
    );
  }
}
