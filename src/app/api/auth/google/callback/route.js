import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { exchangeGoogleAuthCode } from "@/lib/server/drive";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export async function GET(request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(
      `<html><body><h1>Google sign-in failed</h1><p>${escapeHtml(error)}</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code) {
    return new NextResponse(
      "<html><body><h1>Missing authorization code</h1></body></html>",
      { headers: { "Content-Type": "text/html" }, status: 400 }
    );
  }

  try {
    const tokens = await exchangeGoogleAuthCode(code);
    const refreshToken = tokens.refresh_token || "(not returned — revoke app access and try again with prompt=consent)";

    const html = `<!DOCTYPE html>
<html>
<head><title>Google Drive OAuth</title></head>
<body style="font-family:system-ui;max-width:720px;margin:40px auto;padding:0 20px;">
  <h1>Google Drive connected</h1>
  <p>Copy this value into Vercel as <strong>GOOGLE_OAUTH_REFRESH_TOKEN</strong>:</p>
  <textarea readonly style="width:100%;height:120px;font-family:monospace;">${refreshToken}</textarea>
  <p>Also ensure these are set:</p>
  <ul>
    <li>GOOGLE_OAUTH_CLIENT_ID</li>
    <li>GOOGLE_OAUTH_CLIENT_SECRET</li>
    <li>GOOGLE_DRIVE_ROOT_FOLDER_ID (folder in <em>your</em> My Drive)</li>
  </ul>
  <p>Remove or ignore service-account vars for uploads. Redeploy, then test Add Paper.</p>
  <p style="color:#666;font-size:14px;">Close this tab after saving the token. Do not share it publicly.</p>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    return new NextResponse(
      `<html><body><h1>Token exchange failed</h1><pre>${escapeHtml(err?.message || "Unknown error")}</pre></body></html>`,
      { headers: { "Content-Type": "text/html" }, status: 500 }
    );
  }
}
