import API from "../api";

export const IMAGE_PLACEHOLDER_URL = "https://placehold.net/600x600.png";

function isAbsoluteUrl(value: string) {
  return /^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:");
}

export function resolveImageUrl(src?: string | null): string | null {
  if (!src) return null;

  const trimmed = src.trim();
  if (!trimmed) return null;
  if (isAbsoluteUrl(trimmed)) return trimmed;

  const baseURL = API.defaults.baseURL;
  if (typeof baseURL !== "string" || !baseURL.trim()) return trimmed;

  try {
    return new URL(trimmed, `${baseURL.replace(/\/?$/, "/")}`).toString();
  } catch {
    return trimmed;
  }
}

export function resolveImageUrlOrPlaceholder(src?: string | null): string {
  return resolveImageUrl(src) ?? IMAGE_PLACEHOLDER_URL;
}
