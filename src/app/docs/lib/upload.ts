/**
 * File upload to Cloudinary.
 *
 * The cloud name and preset were inlined in the upload modal, so pointing a
 * staging build at a different Cloudinary account meant editing a component.
 * They read from the environment now, with the existing values as fallbacks
 * so nothing changes for a build that has not set them.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dewedem6y";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "testing";

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
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
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
