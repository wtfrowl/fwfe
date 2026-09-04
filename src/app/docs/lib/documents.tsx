import type { ReactNode } from "react";
import {
  FaCar,
  FaCloud,
  FaFileAlt,
  FaPaperclip,
  FaShieldAlt,
  FaStamp,
  FaTools,
} from "react-icons/fa";
import type { DocumentStatus, DocumentType, FleetDocument } from "../../../types/docs";

/**
 * Everything the two document screens need to agree on.
 *
 * Status colour, status wording and date formatting were previously written
 * out by hand in each file — with different rules. The list called a document
 * "expiring" inside 30 days, the detail page inside 7, and the detail page
 * additionally rendered ❌ / ⚠️ / ✅ emoji, which no other screen in the
 * product does. One rule, one vocabulary, stated once.
 */

export const typeIcon: Record<DocumentType, ReactNode> = {
  RC: <FaCar />,
  Insurance: <FaShieldAlt />,
  Permit: <FaStamp />,
  Fitness: <FaTools />,
  Pollution: <FaCloud />,
  Other: <FaPaperclip />,
};

export const iconForType = (type?: string): ReactNode =>
  typeIcon[(type as DocumentType) ?? "Other"] ?? <FaFileAlt />;

type Tone = "success" | "warning" | "danger" | "neutral";

export const statusTone: Record<DocumentStatus, Tone> = {
  expired: "danger",
  expiring: "warning",
  valid: "success",
  "no-expiry": "neutral",
};

/**
 * The short form for a badge in a dense row.
 *
 * "Expires in 4 days" is a number the reader can act on; "Expiring soon" is
 * a mood. The count is the whole value of the badge, so it goes in it.
 */
export const statusLabel = (doc: Pick<FleetDocument, "status" | "daysToExpiry">): string => {
  const days = doc.daysToExpiry;

  switch (doc.status) {
    case "expired":
      if (days === null) return "Expired";
      return days === 0 ? "Expires today" : `Expired ${Math.abs(days)}d ago`;
    case "expiring":
      if (days === null) return "Expiring";
      return days <= 0 ? "Expires today" : `${days}d left`;
    case "valid":
      return "Valid";
    default:
      return "No expiry";
  }
};

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatDate = (value?: string | null): string =>
  value && !Number.isNaN(new Date(value).getTime()) ? dateFormat.format(new Date(value)) : "—";

export const formatDateTime = (value?: string | null): string =>
  value && !Number.isNaN(new Date(value).getTime()) ? dateTimeFormat.format(new Date(value)) : "—";

/** `2024-03-31`, the only format a native date input accepts. */
export const toDateInput = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Whether to render the file in an `<iframe>` or an `<img>`.
 *
 * Checks the recorded MIME type first and only falls back to the extension —
 * a Cloudinary URL can carry transformation segments after the filename, so
 * `endsWith(".pdf")` misses PDFs that plainly are PDFs.
 */
export const isPdf = (doc: Pick<FleetDocument, "viewUrl" | "fileType">): boolean => {
  if (doc.fileType?.includes("pdf")) return true;
  return /\.pdf(\?|#|$)/i.test(doc.viewUrl ?? "");
};

/**
 * Ask Cloudinary to send the file as an attachment with a readable name.
 *
 * Without this the browser saves whatever random id the CDN used, and a
 * folder of downloaded paperwork becomes unsearchable.
 */
export const downloadUrlFor = (doc: FleetDocument): string => {
  const url = doc.downloadUrl || doc.viewUrl;
  if (!url) return "";

  const fileName = [doc.truckId, doc.type, `v${doc.version}`]
    .filter(Boolean)
    .join("_")
    .replace(/[^a-zA-Z0-9-_]/g, "_");

  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/fl_attachment:${fileName}/`);
  }
  return url;
};

/** A one-line summary of a document for sharing outside the app. */
export const shareText = (doc: FleetDocument): string =>
  [
    `${doc.type} — ${doc.name}`,
    `Truck: ${doc.truckId}`,
    doc.expiryDate ? `Expires: ${formatDate(doc.expiryDate)}` : "No expiry date",
    doc.viewUrl,
  ].join("\n");
