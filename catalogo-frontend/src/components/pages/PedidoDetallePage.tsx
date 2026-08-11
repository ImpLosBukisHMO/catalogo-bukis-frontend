import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import NavBar from "../elements/NavBar";
import Footer from "../elements/Footer";

import type { PedidoDetalle, PedidoItem } from "../../types/pedido";
import { getMiPedidoDetalle, uploadComprobante } from "../../services/pedidos";
import { openProtectedComprobante } from "../../services/comprobante";
import { IMAGE_PLACEHOLDER_URL } from "../../utils/images";
import { BACKEND_BASE_URL } from "../../utils/backend";


const ESTADO_COLOR: Record<string, string> = {
  PENDING: "#f5a623",
  APPROVED: "#4a90d9",
  DENIED: "#e63946",
  READY: "#7bc67e",
  SHIPPED: "#9b59b6",
  COMPLETED: "#27ae60",
  CANCELED: "#888",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  DENIED: "Denegado",
  READY: "Listo",
  SHIPPED: "Enviado",
  COMPLETED: "Completado",
  CANCELED: "Cancelado",
};

function money(v: string | number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number(v));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUploadErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as
      | { comprobante_pago?: string[]; error?: string }
      | undefined;

    if (data?.comprobante_pago?.[0]) {
      return data.comprobante_pago[0];
    }

    if (data?.error) {
      return data.error;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible subir el comprobante.";
}

function ItemRow({ item }: { item: PedidoItem }) {
  const imgSrc = item.imagen_principal_snapshot ? `${BACKEND_BASE_URL}${item.imagen_principal_snapshot}` : IMAGE_PLACEHOLDER_URL;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.75rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <figure
        style={{
          width: 64,
          height: 64,
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
          flex: "0 0 64px",
        }}
      >
        <img
          src={imgSrc}
          alt={item.producto_nombre_snapshot}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "https://placehold.net/600x600.png";
          }}
        />
      </figure>

      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-white mb-2">
          {item.producto_nombre_snapshot}
        </p>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-full"
            style={{
              background: item.color_hex_snapshot || "#ccc",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          />
          <span className="inline-flex items-center rounded-full bg-white/12 px-2.5 py-0.5 text-xs font-medium text-white">
            {item.color_nombre_snapshot}
          </span>
        </div>

        <p className="mt-1 text-sm text-white/80 m-0">
          <span className="underline">No. Ítem:</span> <span className="font-semibold">{item.producto_item_snapshot}</span>
        </p>
        
        <p className="mt-1 text-sm text-white/80 m-0">
          <span className="underline">Precio unitario:</span>
          <span className="font-semibold">&nbsp;{money(item.precio_unitario_snapshot)}</span>
        </p>
      </div>

      <div style={{ textAlign: "right", minWidth: 160 }}>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginBottom: 2 }}>
          {money(item.precio_unitario_snapshot)} × {item.cantidad}
        </p>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
          {money(item.subtotal_linea_snapshot)}
        </p>
      </div>
    </div>
  );
}

export default function PedidoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState<PedidoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [proofActionError, setProofActionError] = useState<string | null>(null);
  const [selectedProofName, setSelectedProofName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadMutation = useMutation({
    mutationFn: ({ pedidoId, file }: { pedidoId: number; file: File }) =>
      uploadComprobante(pedidoId, file),
    onSuccess: (updatedPedido) => {
      setPedido(updatedPedido);
      setUploadMessage("Comprobante subido correctamente.");
      setSelectedProofName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (mutationError) => {
      setUploadMessage(getUploadErrorMessage(mutationError));
      setSelectedProofName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  useEffect(() => {
    if (!localStorage.getItem("access")) {
      navigate("/iniciar-sesion");
      return;
    }
    if (!id) return;
    (async () => {
      try {
        const data = await getMiPedidoDetalle(Number(id));
        setPedido(data);
        setUploadMessage(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error cargando pedido");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !pedido) {
      return;
    }

    setUploadMessage(null);
    setSelectedProofName(file.name);

    try {
      await uploadMutation.mutateAsync({ pedidoId: pedido.id, file });
    } catch {
      // Error UI is handled by the mutation onError callback.
    }
  };

  const handleOpenProof = async () => {
    if (!pedido?.comprobante_pago_url) {
      return;
    }

    setProofActionError(null);

    try {
      await openProtectedComprobante(pedido.comprobante_pago_url, pedido.comprobante_pago_nombre);
    } catch {
      setProofActionError("No fue posible abrir el comprobante actual.");
    }
  };

  return (
    <>
      <title>Detalle de pedido | Importaciones Los Bukis</title>
      <NavBar />

      <div
        className="w-full"
        style={{
          paddingLeft: "clamp(1rem, 3vw, 3rem)",
          paddingRight: "clamp(1rem, 3vw, 3rem)",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <button
            className="mb-4 inline-flex items-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
            onClick={() => navigate("/pedidos")}
          >
            ← Mis pedidos
          </button>

          {loading && <p className="text-neutral-600">Cargando pedido...</p>}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            </div>
          )}

          {!loading && !error && pedido && (
            <>
              {/* Encabezado */}
              <div className="mb-6 rounded-2xl bg-[rgba(0,0,0,0.88)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      Pedido #{pedido.folio}
                    </p>
                    <p className="mt-1 text-xs text-white/55">
                      {formatDate(pedido.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className="mb-2 inline-block rounded-full px-3.5 py-1 text-sm font-semibold text-white"
                      style={{
                        background: ESTADO_COLOR[pedido.estado] ?? "#888",
                      }}
                    >
                      {ESTADO_LABEL[pedido.estado] ?? pedido.estado}
                    </span>

                    <p className="text-xl font-bold text-white">
                      {money(pedido.precio_total)}
                    </p>
                  </div>
                </div>

                {/* Mensajes adicionales */}
                {pedido.denegado_razon && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                    <strong>Razón de denegación:</strong> {pedido.denegado_razon}
                  </div>
                )}
                {pedido.nota_worker && (
                  <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
                    <strong>Nota del equipo:</strong> {pedido.nota_worker}
                  </div>
                )}
                {pedido.aprobado_eta && (
                  <p className="mt-2 text-xs text-white/60">
                    Fecha estimada de entrega:{" "}
                    {new Date(pedido.aprobado_eta).toLocaleDateString("es-MX")}
                  </p>
                )}

                {pedido.estado === "APPROVED" && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="m-0 text-sm font-semibold">
                          Comprobante de pago
                        </p>
                        <p className="m-0 mt-1 text-sm text-emerald-900/80">
                          Sube una imagen o PDF del pago realizado.
                        </p>
                      </div>

                      {pedido.comprobante_pago_subido && pedido.comprobante_pago_url && (
                        <div className="rounded-lg border border-emerald-200 bg-white/95 p-3">
                          <p className="m-0 text-sm font-semibold text-neutral-900">
                            Comprobante actual
                          </p>
                          <p className="m-0 mt-2 text-sm text-neutral-700">
                            Archivo actual: <strong>{pedido.comprobante_pago_nombre ?? "Comprobante disponible"}</strong>
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenProof}
                            className="mt-3 inline-flex text-sm font-semibold text-sky-700 underline"
                          >
                            Ver comprobante
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <input
                          ref={fileInputRef}
                          type="file"
                          aria-label="Seleccionar comprobante de pago"
                          accept="image/*,application/pdf"
                          capture="environment"
                          onChange={handleUploadChange}
                          disabled={uploadMutation.isPending}
                          className="sr-only"
                        />
                        <div className="min-w-0 text-sm text-emerald-900/80">
                          {selectedProofName ? (
                            <span>
                              Archivo seleccionado: <strong>{selectedProofName}</strong>
                            </span>
                          ) : (
                            <span>
                              Formatos permitidos: imagen JPG, PNG, WebP o PDF. Máximo 10 MB.
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadMutation.isPending}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pedido.comprobante_pago_subido ? "Reemplazar comprobante" : "Seleccionar comprobante"}
                        </button>
                      </div>

                      {uploadMutation.isPending && (
                        <p className="m-0 text-sm text-neutral-700">
                          Subiendo comprobante...
                        </p>
                      )}

                      {uploadMessage && (
                        <p
                          className={`m-0 text-sm ${uploadMutation.isError ? "text-red-700" : "text-emerald-800"}`}
                        >
                          {uploadMessage}
                        </p>
                      )}

                      {proofActionError && (
                        <p className="m-0 text-sm text-red-700">{proofActionError}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Productos */}
              <div className="rounded-2xl bg-[rgba(0,0,0,0.88)] p-5">
                <p className="mb-3 text-lg font-bold text-white">
                  Productos
                </p>

                {pedido.items.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}

                <div className="mt-4 flex justify-end border-t border-white/10 pt-3">
                  <p className="text-lg font-bold text-white">
                    Total: {money(pedido.precio_total)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
