/**
 * Client-side upload helpers shared by every component that writes to
 * Supabase Storage.
 *
 * The object extension is derived from the validated MIME type, never from
 * the user's file name. A file called "photo.html" with an image/png type is
 * stored as ".png", so a crafted name can never produce an object that a
 * browser would render as HTML or script. The bucket policies in
 * supabase/migrations additionally enforce size and MIME allow-lists on the
 * server side, which is the authoritative check.
 */

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
};

/** Safe storage extension for a file, derived from its MIME type. */
export function extFor(file: Blob, fallback = "jpg"): string {
  const mime = (file.type || "").split(";")[0].trim().toLowerCase();
  return EXT_BY_MIME[mime] ?? fallback;
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Returns an error message, or null when the image is acceptable. */
export function imageProblem(file: File, maxBytes: number): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Use a JPG, PNG, or WebP image.";
  if (file.size > maxBytes) {
    return `Image must be under ${Math.round(maxBytes / (1024 * 1024))} MB.`;
  }
  return null;
}
