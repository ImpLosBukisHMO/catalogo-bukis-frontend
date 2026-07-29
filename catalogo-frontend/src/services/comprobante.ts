import API from "../api";
import { BACKEND_BASE_URL } from "../utils/backend";

function getFileNameFromDisposition(header?: string, fallbackName?: string | null) {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallbackName || "comprobante";
}

const PROTECTED_COMPROBANTE_PATHS = [
  /^\/api\/mis-pedidos\/\d+\/comprobante\/?$/,
  /^\/api\/worker\/pedidos\/\d+\/comprobante\/?$/,
];

function resolveProtectedComprobantePath(url: string) {
  const backendUrl = new URL(BACKEND_BASE_URL);
  const resolvedUrl = new URL(url, backendUrl);

  if (resolvedUrl.origin !== backendUrl.origin) {
    throw new Error("Comprobante URL must target the configured API origin.");
  }

  if (resolvedUrl.search || resolvedUrl.hash) {
    throw new Error("Comprobante URL must not include query params or fragments.");
  }

  const { pathname } = resolvedUrl;
  const isAllowedPath = PROTECTED_COMPROBANTE_PATHS.some((pattern) => pattern.test(pathname));

  if (!isAllowedPath) {
    throw new Error("Comprobante URL must target a protected comprobante endpoint.");
  }

  return pathname;
}

export async function openProtectedComprobante(url: string, fallbackName?: string | null): Promise<void> {
  const response = await API.get(resolveProtectedComprobantePath(url), { responseType: "blob" });
  const blobUrl = URL.createObjectURL(response.data as Blob);
  const openedWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");

  if (!openedWindow) {
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = getFileNameFromDisposition(response.headers?.["content-disposition"], fallbackName);
    anchor.rel = "noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
