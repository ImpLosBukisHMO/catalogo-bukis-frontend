/**
 * Worker Panel — Runtime Design Helpers
 * Importaciones Los Bukis
 *
 * Static surface, text, border, focus, control, and semantic tokens have moved
 * to CSS variables defined under `.worker-scope` in `src/styles/worker.css`.
 * Reference them as `var(--worker-*)` in components.
 *
 * This file contains ONLY runtime lookup helpers where color values must be
 * computed from dynamic data (order status, stock level, etc.) and cannot be
 * expressed as static CSS variable references at build time.
 */

// ─── Order status → worker token name mapping ─────────────────────────────────
// Returns a CSS variable expression (or fallback hex) for the given order state.
// Usage: style={{ color: getPedidoStatusColor(estado) }}

export type PedidoEstado =
  | "PENDING"
  | "APPROVED"
  | "READY"
  | "SHIPPED"
  | "COMPLETED"
  | "DENIED"
  | "CANCELED";

export function getPedidoStatusColor(estado: string): string {
  switch (estado as PedidoEstado) {
    case "PENDING":
      return "var(--worker-error-fg)";
    case "APPROVED":
      return "var(--worker-dispatch-fg)";
    case "READY":
      return "var(--worker-dispatch-fg)";
    case "SHIPPED":
      return "var(--worker-inventory-fg)";
    case "COMPLETED":
      return "var(--worker-ink-secondary)";
    case "DENIED":
      return "var(--worker-ink-muted)";
    case "CANCELED":
      return "var(--worker-ink-muted)";
    default:
      return "var(--worker-ink-tertiary)";
  }
}

export function getPedidoStatusBg(estado: string): string {
  switch (estado as PedidoEstado) {
    case "PENDING":
      return "var(--worker-error-bg)";
    case "APPROVED":
      return "var(--worker-dispatch-bg)";
    case "READY":
      return "var(--worker-dispatch-bg)";
    case "SHIPPED":
      return "var(--worker-inventory-bg)";
    case "COMPLETED":
    case "DENIED":
    case "CANCELED":
      return "transparent";
    default:
      return "transparent";
  }
}

// ─── Stock level → worker token name mapping ──────────────────────────────────
// Returns a semantic classification for a stock quantity.

export type StockTone = "ok" | "low" | "out";

export function getStockTone(stock: number, lowThreshold = 3): StockTone {
  if (stock <= 0) return "out";
  if (stock <= lowThreshold) return "low";
  return "ok";
}

export function getStockColor(stock: number, lowThreshold = 3): string {
  const tone = getStockTone(stock, lowThreshold);
  switch (tone) {
    case "out":
      return "var(--worker-error-fg)";
    case "low":
      return "var(--worker-dispatch-fg)";
    case "ok":
      return "var(--worker-inventory-fg)";
  }
}

// ─── Legacy named exports removed in PR 4 ────────────────────────────────────
// statusColor, surface, ink, and semantic static exports were removed after
// WorkerProductsPage (the last consumer) completed its React Query + token migration.
// All static tokens now live in src/styles/worker.css under .worker-scope.
// Runtime helpers above (getPedidoStatusColor, getPedidoStatusBg, getStockTone,
// getStockColor) remain — they require dynamic computation and cannot be CSS-only.
