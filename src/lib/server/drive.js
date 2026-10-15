import { google } from "googleapis";
import { createPrivateKey } from "crypto";
import { Readable } from "stream";

const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";

function normalizePrivateKey(rawKey = "") {
  const trimmed = rawKey.trim();
  const wrappedInDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  const wrappedInSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");
  const withoutWrappingQuotes =
    wrappedInDoubleQuotes || wrappedInSingleQuotes
      ? trimmed.slice(1, -1)
      : trimmed;

  return withoutWrappingQuotes.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

function getCredentialsFromEnv() {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";
  if (rawJson.trim()) {
    try {
      const parsed = JSON.parse(rawJson);
      return {
        clientEmail: parsed.client_email || "",
        privateKey: normalizePrivateKey(parsed.private_key || ""),
      };
    } catch {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON. Please paste exact service account JSON string."
      );
    }
  }

  return {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL || "",
    privateKey: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY || ""),
  };
}

function assertValidPrivateKey(privateKey) {
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "GOOGLE_PRIVATE_KEY format is invalid. It must include BEGIN PRIVATE KEY/END PRIVATE KEY."
    );
  }

  try {
    createPrivateKey({ key: privateKey, format: "pem" });
  } catch {
    throw new Error(
      "Google private key is not parseable. Check env value and ensure newline format is correct."
    );
  }
}

function useOAuth() {
  return Boolean(
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN &&
      process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
}

function useSharedDrive() {
  return process.env.GOOGLE_DRIVE_USE_SHARED_DRIVE === "true";
}

function getDelegatedUser() {
  return (
    process.env.GOOGLE_DRIVE_DELEGATED_USER ||
    process.env.GOOGLE_IMPERSONATE_USER ||
    ""
  ).trim();
}

function driveFlags() {
  if (!useSharedDrive()) return {};
  return {
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  };
}

function getOAuthRedirectUri() {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI) {
    return process.env.GOOGLE_OAUTH_REDIRECT_URI;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/auth/google/callback`;
  }
  return "http://localhost:3000/api/auth/google/callback";
}

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    getOAuthRedirectUri()
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function getServiceAccountAuth() {
  const { clientEmail, privateKey } = getCredentialsFromEnv();
  const delegatedUser = getDelegatedUser();

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Google service account is not configured. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY."
    );
  }
  assertValidPrivateKey(privateKey);

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [DRIVE_SCOPE],
    ...(delegatedUser ? { subject: delegatedUser } : {}),
  });
}

function getDriveAuth() {
  if (useOAuth()) {
    return getOAuth2Client();
  }
  return getServiceAccountAuth();
}

function getDriveClient() {
  return google.drive({ version: "v3", auth: getDriveAuth() });
}

function formatDriveError(error) {
  const message = error?.message || "";
  if (message.includes("storage quota") || message.includes("storageQuotaExceeded")) {
    if (!useOAuth()) {
      return [
        "Service accounts cannot store files in personal Google Drive.",
        "Use OAuth instead (no admin required):",
        "1) Create an OAuth Web Client in Google Cloud Console.",
        "2) Visit /api/auth/google on your site once to sign in and get a refresh token.",
        "3) Add GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN to Vercel.",
        "See docs/GOOGLE_DRIVE_OAUTH.md in the repo for step-by-step instructions.",
      ].join(" ");
    }
  }
  if (message.includes("unauthorized_client") && getDelegatedUser()) {
    return [
      "Domain-wide delegation is not configured for this service account.",
      "Use OAuth instead (see docs/GOOGLE_DRIVE_OAUTH.md) or ask IT to enable delegation.",
    ].join(" ");
  }
  return message || "Google Drive upload failed.";
}

async function findFolderIdByName(drive, parentId, folderName) {
  const escapedName = folderName.replace(/'/g, "\\'");
  const response = await drive.files.list({
    q: [
      `'${parentId}' in parents`,
      `name = '${escapedName}'`,
      `mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`,
      "trashed = false",
    ].join(" and "),
    fields: "files(id, name)",
    pageSize: 1,
    ...driveFlags(),
  });

  return response.data.files?.[0]?.id || null;
}

async function createFolder(drive, parentId, folderName) {
  const response = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: DRIVE_FOLDER_MIME_TYPE,
      parents: [parentId],
    },
    fields: "id, name",
    ...driveFlags(),
  });

  return response.data.id;
}

export async function ensureNestedFolder(department, year, semester) {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
  }

  const drive = getDriveClient();
  const parts = [department, `Year ${year}`, `Semester ${semester}`];
  let currentParent = rootId;

  for (const part of parts) {
    const existingFolderId = await findFolderIdByName(drive, currentParent, part);
    if (existingFolderId) {
      currentParent = existingFolderId;
      continue;
    }

    currentParent = await createFolder(drive, currentParent, part);
  }

  return {
    folderId: currentParent,
    folderPath: parts.join(" / "),
  };
}

async function makeFileShareable(drive, fileId) {
  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
    ...driveFlags(),
  });
}

export async function uploadPaperToDrive({ file, department, year, semester }) {
  try {
    const drive = getDriveClient();
    const { folderId, folderPath } = await ensureNestedFolder(
      department,
      year,
      semester
    );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileStream = Readable.from(buffer);
    const mimeType = file.type || "application/pdf";

    const uploadResponse = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: fileStream,
      },
      fields: "id, name, webViewLink",
      ...driveFlags(),
    });

    const fileId = uploadResponse.data.id;
    if (!fileId) {
      throw new Error("Failed to upload file to Google Drive.");
    }

    await makeFileShareable(drive, fileId);

    const refreshed = await drive.files.get({
      fileId,
      fields: "id, webViewLink, webContentLink",
      ...driveFlags(),
    });

    const viewLink =
      refreshed.data.webViewLink ||
      `https://drive.google.com/file/d/${fileId}/view`;

    return {
      driveFileId: fileId,
      driveLink: viewLink,
      drivePreviewLink: `https://drive.google.com/file/d/${fileId}/preview`,
      driveFolderPath: folderPath,
    };
  } catch (error) {
    throw new Error(formatDriveError(error));
  }
}

export async function trashDriveFile(fileId) {
  try {
    const drive = getDriveClient();
    await drive.files.update({
      fileId,
      requestBody: { trashed: true },
      ...driveFlags(),
    });
  } catch (error) {
    // Already gone from Drive — nothing left to clean up.
    if (error?.code === 404) return;
    throw new Error(formatDriveError(error));
  }
}

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET first."
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, getOAuthRedirectUri());
}

export function getGoogleAuthUrl() {
  const oauth2Client = getGoogleOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_SCOPE],
  });
}

export async function exchangeGoogleAuthCode(code) {
  const oauth2Client = getGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}
