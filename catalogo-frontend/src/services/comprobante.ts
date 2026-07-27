import API from "../api";

function getFileNameFromDisposition(header?: string, fallbackName?: string | null) {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallbackName || "comprobante";
}

export async function openProtectedComprobante(url: string, fallbackName?: string | null): Promise<void> {
  const response = await API.get(url, { responseType: "blob" });
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
