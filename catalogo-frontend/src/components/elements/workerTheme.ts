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

// ─── Legacy named exports (kept for backward compatibility during migration) ──
// These reference the same token system — pages can migrate incrementally.
// Remove after WorkerOrdersPage and WorkerProductsPage are fully migrated.

/** @deprecated Use getPedidoStatusColor() instead */
export const statusColor: Record<string, string> = {
  PENDING: "var(--worker-error-fg)",
  APPROVED: "var(--worker-dispatch-fg)",
  READY: "var(--worker-dispatch-fg)",
  SHIPPED: "var(--worker-inventory-fg)",
  COMPLETED: "var(--worker-ink-secondary)",
  DENIED: "var(--worker-ink-muted)",
  CANCELED: "var(--worker-ink-muted)",
};

/** @deprecated Static surface tokens live in CSS variables now — use var(--worker-*) directly */
export const surface = {
  canvas: "var(--worker-canvas)",
  card: "var(--worker-shelf)",
  inset: "var(--worker-bench)",
  border: "var(--worker-border-soft)",
  borderMid: "var(--worker-border)",
  borderStrong: "var(--worker-border-strong)",
} as const;

/** @deprecated Static ink tokens live in CSS variables now — use var(--worker-*) directly */
export const ink = {
  primary: "var(--worker-ink)",
  secondary: "var(--worker-ink-secondary)",
  tertiary: "var(--worker-ink-tertiary)",
} as const;

/** @deprecated Static semantic tokens live in CSS variables now — use var(--worker-*) directly */
export const semantic = {
  danger: {
    fg: "var(--worker-error-fg)",
    bg: "var(--worker-error-bg)",
    border: "var(--worker-error-border)",
  },
  warning: {
    fg: "var(--worker-dispatch-fg)",
    bg: "var(--worker-dispatch-bg)",
    border: "var(--worker-dispatch-border)",
  },
  success: {
    fg: "var(--worker-inventory-fg)",
    bg: "var(--worker-inventory-bg)",
    border: "var(--worker-inventory-border)",
  },
  info: {
    fg: "var(--worker-info-fg)",
    bg: "var(--worker-info-bg)",
    border: "var(--worker-info-border)",
  },
} as const;
