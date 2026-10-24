// Shared by bulk-upload-papers.mjs and sync-drive-papers.mjs: turns a Year/Semester/Session/File path into a manifest row.

const MONTHS = {
  jan: "January",
  feb: "February",
  mar: "March",
  apr: "April",
  may: "May",
  jun: "June",
  jul: "July",
  aug: "August",
  sep: "September",
  oct: "October",
  nov: "November",
  dec: "December",
};

// Known prefixes and the OCR-style mistakes found in file names.
const KNOWN_PREFIXES = new Set(["ICT", "COM", "FDN", "IDC", "CMP", "BIO", "MAT", "MAP", "PHY", "STA", "CHE", "ZOO", "BOT", "GEO", "ENV", "CSC", "SCI"]);
const PREFIX_FIXES = { LCT: "ICT", TCT: "ICT" };
const RAW_NAME_FIXES = [[/^CT1 402\b/, "ICT 1402"]];
const TITLE_FIXES = [
  [/\bSCIENCS\b/g, "SCIENCES"],
  [/\bSCIENCES,/g, "SCIENCES"],
  [/(?<=[A-Z])0(?=[A-Z])/g, "O"], // "PR0GRAM"
];

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "for", "in", "of", "on", "or", "the", "to", "with"]);
const ACRONYMS = new Set(["ICT", "IT", "GIS", "HCI", "OS", "SQL", "UML", "AI", "IOT", "II", "III", "IV", "ERP", "MIS"]);

// ---------- helpers ----------

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positional = [];
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      i++;
    }
  }
  return { command, folder: positional[0], options };
}

function walkPdfs(root) {
  const results = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.toLowerCase().endsWith(".pdf")) results.push(full);
    }
  }
  return results.sort();
}

function writeCsv(file, columns, rows) {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.join(","), ...rows.map((row) => columns.map((col) => escape(row[col])).join(","))];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // BOM so Excel opens it as UTF-8.
  fs.writeFileSync(file, "\uFEFF" + lines.join("\r\n") + "\r\n");
}

function startRunLog(command) {
  fs.mkdirSync(path.join(OUT_DIR, "logs"), { recursive: true });
  runLogPath = path.join(OUT_DIR, "logs", `${command}-${RUN_ID}.log`);
  log(`run started: node scripts/bulk-upload-papers.mjs ${process.argv.slice(2).join(" ")}`);
}

// Prints to the console and appends a timestamped line to this run's log file.
function log(message, level = "info") {
  const print = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  print(message);
  if (runLogPath) {
    fs.appendFileSync(runLogPath, `${new Date().toISOString()} [${level.toUpperCase()}] ${message}\n`);
  }
}

function loadEnvFile(file = ".env.local") {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

async function login(baseUrl) {
  loadEnvFile();
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD (in .env.local) so the script can sign in.");
  }

  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).catch((error) => {
    throw new Error(`Cannot reach ${baseUrl} (${error.cause?.code || error.message}). Is "npm run dev" running?`);
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Admin login failed: ${payload.message || `HTTP ${response.status}`}`);

  log(`signed in to ${baseUrl} as ${username}`);
  return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  text = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((value) => value !== "")) rows.push(row);
  }

  const [header, ...body] = rows;
  // Excel may save with ";" in some locales — fail loudly instead of guessing.
  if (!header || !header.includes("subjectCode")) {
    throw new Error("manifest.csv header not recognised. Save it as comma-separated CSV (UTF-8).");
  }
  return body.map((values) => Object.fromEntries(header.map((key, idx) => [key.trim(), (values[idx] ?? "").trim()])));
}

export function titleCase(text) {
  return text
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((word, index) => {
      if (!word.trim() || word === "-") return word;
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      if (index > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

export function normalizeCode(prefix, digits, notes) {
  let fixedPrefix = prefix.toUpperCase();
  if (PREFIX_FIXES[fixedPrefix]) {
    fixedPrefix = PREFIX_FIXES[fixedPrefix];
    notes.add(`code prefix corrected from "${prefix}"`);
  }
  if (!KNOWN_PREFIXES.has(fixedPrefix)) notes.add(`unknown code prefix "${prefix}"`);

  const fixedDigits = digits.replace(/[Il]/g, "1").replace(/[Oo]/g, "0");
  if (fixedDigits !== digits) notes.add(`code digits corrected from "${digits}"`);

  return `${fixedPrefix}${fixedDigits}`;
}

export function parseFileName(fileName, notes) {
  let stem = fileName.replace(/\.pdf$/i, "").trim();

  const copyMatch = stem.match(/\s*\((\d+)\)$/);
  if (copyMatch) {
    stem = stem.slice(0, copyMatch.index);
    notes.add(`copy (${copyMatch[1]}) — second paper for this subject`);
  }

  for (const [pattern, replacement] of RAW_NAME_FIXES) {
    if (pattern.test(stem)) {
      notes.add(`code corrected from "${stem.match(pattern)[0]}"`);
      stem = stem.replace(pattern, replacement);
    }
  }

  const match = stem.match(/^((?:[A-Za-z]{2,4}\s*[0-9OoIl]{4}\s*_?\s*)+)-?\s*(.+)$/);
  if (!match) {
    notes.add("could not read code/title from file name — fill in manually");
    return { subjectCode: "", subjectName: titleCase(stem) };
  }

  const codes = [...match[1].matchAll(/([A-Za-z]{2,4})\s*([0-9OoIl]{4})/g)].map(([, prefix, digits]) =>
    normalizeCode(prefix, digits, notes)
  );
  if (codes.length > 1) notes.add("shared paper with multiple codes");

  let title = match[2].trim();
  for (const [pattern, replacement] of TITLE_FIXES) title = title.replace(pattern, replacement);
  // "NON - SCIENCE" / "E - COMMERCE" are hyphenated words, not separators.
  title = title.replace(/\b(NON|E)\s+-\s+/gi, "$1-");

  return { subjectCode: codes.join(" / "), subjectName: titleCase(title) };
}

// "2026 Mar-May" -> ["March | May 2026"], "2016 May-Jun & Nov-Dec" -> ["May | June 2016", "November | December 2016"]
export function parseSession(folderName) {
  const match = folderName.match(/^(\d{4})\s+(.+)$/);
  if (!match) return null;
  const [, year, rangesText] = match;
  return rangesText.split("&").map((range) => {
    const months = range
      .trim()
      .split("-")
      .map((part) => MONTHS[part.trim().slice(0, 3).toLowerCase()]);
    if (months.some((month) => !month)) return "";
    return `${months.join(" | ")} ${year}`;
  });
}

// relativePaths: "Year 1/Semester 1/2026 Mar-May/ICT 1101 - TITLE.pdf" style paths (any depth is flagged, not rejected).
export function buildRows(relativePaths, department) {
  const rows = relativePaths.map((relative) => {
    const parts = relative.split("/");
    const notes = new Set();

    if (parts.length !== 4) notes.add("unexpected folder depth — check year/semester/period");
    const [yearFolder = "", semesterFolder = "", sessionFolder = "", fileName = ""] =
      parts.length === 4 ? parts : ["", "", "", parts.at(-1)];

    const year = Number.parseInt((yearFolder.match(/Year\s*(\d)/i) || [])[1], 10) || "";
    const semesterMatch = semesterFolder.match(/^Semester\s*([12])$/i);
    const { subjectCode, subjectName } = parseFileName(fileName, notes);

    return {
      include: "yes",
      subjectCode,
      subjectName,
      examPeriod: "",
      year,
      semester: semesterMatch ? Number(semesterMatch[1]) : "",
      department,
      instructor: "",
      file: relative,
      notes,
      semesterFolder,
      sessions: parseSession(sessionFolder) || [],
    };
  });

  // Learn which semester each subject usually belongs to from the plain "Semester 1/2" folders,
  // then use that for "Semester 1 & 2" and "Pre Semester" folders.
  const semesterCounts = new Map();
  for (const row of rows) {
    if (!row.semester || !row.subjectCode) continue;
    const key = row.subjectCode.split(" / ")[0];
    const counts = semesterCounts.get(key) || { 1: 0, 2: 0 };
    counts[row.semester]++;
    semesterCounts.set(key, counts);
  }

  for (const row of rows) {
    if (!row.semester) {
      const counts = semesterCounts.get(row.subjectCode.split(" / ")[0]) || { 1: 0, 2: 0 };
      if (counts[1] !== counts[2]) {
        row.semester = counts[1] > counts[2] ? 1 : 2;
        row.notes.add(
          `semester ${row.semester} inferred from "${row.semesterFolder}" folder (other sessions: S1×${counts[1]}, S2×${counts[2]})`
        );
      } else {
        row.semester = 1;
        row.notes.add(
          `CHECK semester — "${row.semesterFolder}" folder, other sessions don't decide (S1×${counts[1]}, S2×${counts[2]}); defaulted to 1`
        );
      }
    }

    if (row.sessions.length === 1) {
      row.examPeriod = row.sessions[0];
    } else if (row.sessions.length > 1) {
      // Combined folder: first range is semester 1, second is semester 2.
      row.examPeriod = row.sessions[row.semester - 1] || row.sessions[0];
      row.notes.add("exam period picked from combined-semester folder");
    }
    if (!row.examPeriod) row.notes.add("CHECK exam period — could not read session folder");

    const codeYear = Number(row.subjectCode.match(/\d/)?.[0]);
    if (codeYear && row.year && codeYear !== row.year) {
      row.notes.add(`code is a year-${codeYear} subject but folder is Year ${row.year}`);
    }
  }

  const seen = new Map();
  for (const row of rows) {
    const key = `${row.subjectCode}|${row.examPeriod}`;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  for (const row of rows) {
    if (seen.get(`${row.subjectCode}|${row.examPeriod}`) > 1) {
      row.notes.add("same subject + exam period appears more than once — check before uploading");
    }
    row.notes = [...row.notes].join("; ");
  }


  return rows;
}
