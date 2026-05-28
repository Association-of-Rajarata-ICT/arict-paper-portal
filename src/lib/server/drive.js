import { google } from "googleapis";

const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

function normalizePrivateKey(rawKey = "") {
  const trimmed = rawKey.trim();
  const withoutWrappingQuotes =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed;

  return withoutWrappingQuotes.replace(/\\n/g, "\n");
}

function getDriveClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY || "");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Drive credentials are not configured.");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
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
  });
}

export async function uploadPaperToDrive({ file, department, year, semester }) {
  const drive = getDriveClient();
  const { folderId, folderPath } = await ensureNestedFolder(department, year, semester);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = file.type || "application/pdf";

  const uploadResponse = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: buffer,
    },
    fields: "id, name, webViewLink",
  });

  const fileId = uploadResponse.data.id;
  if (!fileId) {
    throw new Error("Failed to upload file to Google Drive.");
  }

  await makeFileShareable(drive, fileId);

  const refreshed = await drive.files.get({
    fileId,
    fields: "id, webViewLink, webContentLink",
  });

  const viewLink =
    refreshed.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

  return {
    driveFileId: fileId,
    driveLink: viewLink,
    drivePreviewLink: `https://drive.google.com/file/d/${fileId}/preview`,
    driveFolderPath: folderPath,
  };
}
