import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/server/adminAuth";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");

    if (!(await verifyAdminCredentials(username, password))) {
      // Slow down password guessing.
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json({ message: "Incorrect username or password." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSessionToken(), adminSessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error?.message || "Login failed." },
      { status: 500 }
    );
  }
}
