// Plain ESM (.mjs) so the Node scripts in /scripts can import it as well as the app.

const PART_NUMERALS = { i: "I", ii: "II", iii: "III", iv: "IV", 1: "I", 2: "II", 3: "III", 4: "IV", 11: "II" };

// "COM1201", "com 1201", "ICT1402 / COM1402" -> lowercase letters and digits only, for matching.
export function compactText(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Name a downloaded PDF after the paper so files from different sittings don't overwrite each other:
// "COM1201_Year1_Semester2_March-May-2026.pdf". Part I / Part II papers get a "_Part-II" suffix.
export function paperFileName({ subjectCode, subjectName = "", examPeriod, year, semester }) {
  const clean = (value) => String(value ?? "").replace(/[\\/:*?"<>|]/g, " ").trim();

  const code = clean(String(subjectCode ?? "").replace(/\s*\/\s*/g, "-")).replace(/\s+/g, "");
  const period = clean(examPeriod)
    .replace(/\s*[|&,]\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  // OCR'd titles spell Part II as "PART 11" or "PART _II".
  const part = String(subjectName).match(/\bpart[\s_\-(]*(iii|ii|iv|i|11|[1-4])\b/i);

  const pieces = [
    code || "Paper",
    year ? `Year${year}` : "",
    semester ? `Semester${semester}` : "",
    period,
    part ? `Part-${PART_NUMERALS[part[1].toLowerCase()]}` : "",
  ].filter(Boolean);
  return `${pieces.join("_")}.pdf`;
}
