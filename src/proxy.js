import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/server/adminAuth";

// Guards admin pages only. API routes check the session themselves (requireAdmin), so
// large PDF uploads to /api/papers don't pass through proxy body buffering (10MB cap).
export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const loggedIn = await isAdminRequest(request);

  if (pathname === "/admin/login") {
    return loggedIn ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
  }

  if (!loggedIn) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
