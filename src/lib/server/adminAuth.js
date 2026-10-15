import { NextResponse } from "next/server";

// Admin credentials live in env vars: ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET.
// The session cookie is "<expiresAt>.<hmac(expiresAt)>", signed with ADMIN_SESSION_SECRET.

export const ADMIN_SESSION_COOKIE = "arict_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  if (secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set (at least 32 characters).");
  }
  return secret;
}

function toBase64Url(buffer) {
  return Buffer.from(buffer).toString("base64url");
}

async function hmac(value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

// Compare HMACs of both values so neither timing nor length leaks the secret.
async function safeEqual(a, b) {
  const [left, right] = await Promise.all([hmac(String(a)), hmac(String(b))]);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0 && left.length === right.length;
}

export async function verifyAdminCredentials(username, password) {
  const expectedUser = process.env.ADMIN_USERNAME || "";
  const expectedPassword = process.env.ADMIN_PASSWORD || "";
  if (!expectedUser || !expectedPassword) {
    throw new Error("Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.");
  }

  const [userOk, passwordOk] = await Promise.all([
    safeEqual(username, expectedUser),
    safeEqual(password, expectedPassword),
  ]);
  return userOk && passwordOk;
}

export async function createAdminSessionToken() {
  const expiresAt = String(Date.now() + ADMIN_SESSION_MAX_AGE * 1000);
  return `${expiresAt}.${await hmac(expiresAt)}`;
}

export async function verifyAdminSessionToken(token) {
  if (!token) return false;
  const [expiresAt, signature] = String(token).split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) return false;
  try {
    return await safeEqual(signature, await hmac(expiresAt));
  } catch {
    return false;
  }
}

export function isAdminRequest(request) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

// For route handlers: returns a 401 response when the caller is not signed in.
export async function requireAdmin(request) {
  if (await isAdminRequest(request)) return null;
  return NextResponse.json({ message: "Admin login required." }, { status: 401 });
}

export function adminSessionCookieOptions(maxAge = ADMIN_SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
