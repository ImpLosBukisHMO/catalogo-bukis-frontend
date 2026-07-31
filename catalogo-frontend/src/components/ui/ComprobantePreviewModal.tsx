import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchProtectedComprobante } from "../../services/comprobante";

type ComprobantePreviewModalProps = {
  url: string | null;
  fallbackName: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ComprobantePreviewModal({ url, fallbackName, isOpen, onClose }: ComprobantePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !url) {
      setBlobUrl(null);
      setFileType(null);
      setFileName(null);
      setError(null);
      return;
    }

    let active = true;
    let createdUrl: string | null = null;

    async function loadComprobante() {
      setIsLoading(true);
      setError(null);
      try {
        const { blob, fileName: resolvedName } = await fetchProtectedComprobante(url!, fallbackName);
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
        setFileType(blob.type);
        setFileName(resolvedName);
      } catch (err) {
        if (active) {
          console.error(err);
          setError("No se pudo cargar el comprobante. Intenta nuevamente más tarde.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadComprobante();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, url, fallbackName]);

  // Handle ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "800px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
            {isLoading ? "Cargando comprobante..." : fileName || "Comprobante"}
          </h3>
          <div style={{ display: "flex", gap: "12px" }}>
            {blobUrl && (
              <a
                href={blobUrl}
                download={fileName || "comprobante"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  backgroundColor: "#0f172a",
                  borderRadius: "6px",
                  textDecoration: "none",
                }}
              >
                Descargar
              </a>
            )}
            <button
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                cursor: "pointer",
                color: "#64748b",
                fontSize: 20,
                lineHeight: 1,
              }}
              title="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f1f5f9",
            minHeight: "300px",
          }}
        >
          {isLoading && <p style={{ color: "#64748b" }}>Obteniendo archivo de forma segura...</p>}
          {error && <p style={{ color: "#ef4444" }}>{error}</p>}
          {!isLoading && !error && blobUrl && (
            <>
              {fileType?.startsWith("image/") ? (
                <img
                  src={blobUrl}
                  alt={fileName || "Comprobante"}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                    borderRadius: "4px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              ) : fileType === "application/pdf" ? (
                <iframe
                  src={blobUrl}
                  style={{
                    width: "100%",
                    height: "70vh",
                    border: "none",
                    borderRadius: "4px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  title={fileName || "Comprobante PDF"}
                />
              ) : (
                <div style={{ textAlign: "center", color: "#64748b" }}>
                  <p>Este tipo de archivo ({fileType}) no se puede previsualizar.</p>
                  <p>Por favor usa el botón de Descargar arriba.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
