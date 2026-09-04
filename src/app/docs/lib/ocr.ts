import type { DocumentType } from "../../../types/docs";

/**
 * Best-effort reading of an uploaded document.
 *
 * This is a convenience, never a source of truth: everything it produces
 * lands in an editable field with a hint telling the user to check it. The
 * cost of a wrong expiry date silently saved is a truck stopped at a
 * checkpoint, so nothing here is ever written without a human looking at it.
 */

export interface ExtractedFields {
  type?: DocumentType;
  name?: string;
  truckId?: string;
  expiryDate?: string;
  notes?: string;
}

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8,
  oct: 9, nov: 10, dec: 11,
};

/* OCR reliably confuses these with digits inside a registration number. */
const CONFUSIONS: Record<string, string> = {
  S: "5", O: "0", I: "1", L: "1", Z: "2", B: "8", G: "6", Q: "0",
};

const toIsoDate = (day: number, month: number, year: number): string | undefined => {
  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(Date.UTC(fullYear, month, day));
  if (Number.isNaN(date.getTime())) return undefined;
  if (date.getUTCDate() !== day || date.getUTCMonth() !== month) return undefined;
  return date.toISOString().slice(0, 10);
};

const detectType = (lower: string): DocumentType => {
  if (lower.includes("insurance") || lower.includes("policy")) return "Insurance";
  if (lower.includes("pollution") || lower.includes("puc")) return "Pollution";
  if (lower.includes("fitness")) return "Fitness";
  if (lower.includes("permit")) return "Permit";
  if (lower.includes("registration certificate") || /\brc\b/.test(lower)) return "RC";
  return "Other";
};

const detectExpiry = (text: string): string | undefined => {
  const match = text.match(
    /(expire|expiry|valid.{0,12}?(till|up ?to|upto|until|on))[^0-9]{0,20}([0-9]{1,2})[\s\-/.]([A-Za-z]{3,9}|[0-9]{1,2})[\s\-/.]([0-9]{2,4})/i
  );
  if (!match) return undefined;

  const [, , , dayRaw, monthRaw, yearRaw] = match;
  const day = parseInt(dayRaw, 10);
  const year = parseInt(yearRaw, 10);
  const month = /^[0-9]+$/.test(monthRaw)
    ? parseInt(monthRaw, 10) - 1
    : MONTHS[monthRaw.toLowerCase()];

  if (month === undefined || Number.isNaN(month)) return undefined;
  return toIsoDate(day, month, year);
};

const detectRegistration = (text: string): string | undefined => {
  const flat = text.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").toUpperCase();
  const match = flat.match(/\b([A-Z]{2})[\s-]?([0-9O]{2})[\s-]?([A-Z]{1,3})[\s-]?([A-Z0-9]{4})\b/);
  if (!match) return undefined;

  const [, state, district, series, tail] = match;
  /* Only the trailing block is numeric, so only it gets the digit fixes —
     applying them to the series would turn a genuine "SB" into "58". */
  const digits = tail.replace(/[A-Z]/g, (c) => CONFUSIONS[c] ?? c);
  return `${state}${district.replace(/O/g, "0")}${series}${digits}`;
};

export const extractDocumentFields = (text: string): ExtractedFields => {
  const lower = text.toLowerCase();
  const type = detectType(lower);

  const nameMatch = text.match(/(Permit|Insurance|Registration|Fitness|Pollution)[^\n]{0,30}/i);

  return {
    type,
    name: nameMatch ? nameMatch[0].trim() : type === "Other" ? undefined : type,
    truckId: detectRegistration(text),
    expiryDate: detectExpiry(text),
    notes: text.replace(/\s+/g, " ").trim().slice(0, 300),
  };
};

/**
 * Tesseract reads pixels. Handing it a PDF wastes ten seconds and returns
 * nothing, so the caller checks this before spending the user's time.
 */
export const isOcrCandidate = (file: File): boolean => file.type.startsWith("image/");
