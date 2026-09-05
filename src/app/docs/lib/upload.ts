import api from "../../../api/axios";

/**
 * File upload to Cloudinary.
 *
 * Signed by the server where the server is configured for it.
 *
 * The unsigned path below is what this used to do exclusively, and it had two
 * problems: the preset sat in the JavaScript bundle, so anyone could upload to
 * the fleet's account and burn its quota; and every file landed public, so an
 * RC book or a driving licence was readable by anyone who ever saw the URL.
 *
 * `/api/docs/upload-ticket` returns a short-lived signature and a folder
 * derived from the owner's id, and the resulting asset is private — the API
 * mints a fresh viewing link each time a document is read. When the server has
 * no Cloudinary credentials the ticket comes back `enabled: false` and we fall
 * back to the unsigned preset, so a deployment that has not been migrated
 * keeps working exactly as before.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dewedem6y";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "testing";

interface UploadTicket {
  enabled: boolean;
  cloudName?: string;
  apiKey?: string;
  timestamp?: number;
  signature?: string;
  folder?: string;
  type?: string;
  accessMode?: string;
}

/* Fetched per upload rather than cached: the signature carries a timestamp
   and Cloudinary rejects one that has gone stale. */
const getTicket = async (): Promise<UploadTicket | null> => {
  try {
    return (await api.get("/api/docs/upload-ticket")) as unknown as UploadTicket;
  } catch {
    /* An older server has no such route. Fall back rather than failing the
       upload — this endpoint is an upgrade, not a dependency. */
    return null;
  }
};

/** 10 MB. Big enough for a scanned multi-page permit, small enough to send. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_TYPES = "application/pdf,image/png,image/jpeg,image/webp";

export interface UploadedFile {
  viewUrl: string;
  downloadUrl: string;
  fileType: string;
  fileSize: number;
}

export class UploadError extends Error {}

/**
 * Rejected before the network is touched, so the user hears about a 40 MB
 * scan immediately rather than after watching a progress spinner.
 */
export const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_BYTES) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.`;
  }
  if (!/^(image\/(png|jpe?g|webp)|application\/pdf)$/i.test(file.type)) {
    return "Attach a PDF, JPG, PNG or WebP.";
  }
  return null;
};

export const uploadFile = async (file: File, signal?: AbortSignal): Promise<UploadedFile> => {
  const ticket = await getTicket();
  const signed = Boolean(ticket?.enabled && ticket.signature);

  const body = new FormData();
  body.append("file", file);

  if (signed && ticket) {
    /* Every field in the signature must be sent, and nothing that was not
       signed may be added — Cloudinary recomputes the hash over what it
       receives and rejects any mismatch. */
    body.append("api_key", ticket.apiKey!);
    body.append("timestamp", String(ticket.timestamp));
    body.append("signature", ticket.signature!);
    body.append("folder", ticket.folder!);
    body.append("type", ticket.type!);
    body.append("access_mode", ticket.accessMode!);
  } else {
    body.append("upload_preset", UPLOAD_PRESET);
  }

  const cloudName = signed && ticket?.cloudName ? ticket.cloudName : CLOUD_NAME;

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body,
    signal,
  });

  if (!res.ok) {
    throw new UploadError("That file could not be uploaded. Please try again.");
  }

  const data = await res.json();
  if (!data?.secure_url) {
    throw new UploadError("The file uploaded but no link came back. Please try again.");
  }

  return {
    viewUrl: data.secure_url,
    downloadUrl: data.secure_url,
    fileType: file.type,
    fileSize: file.size,
  };
};
