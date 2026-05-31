/**
 * Worker Panel — Design Tokens
 * Importaciones Los Bukis
 *
 * Remaining tokens are dynamic/semantic — used as inline styles
 * where color is computed at runtime (status, stock level, etc.).
 * Static layout tokens have been replaced with Bulma classes.
 */

// ─── Slate scale ─────────────────────────────────────────────────
const sl = {
  900: "#0f172a",
  800: "#1e293b",
  700: "#334155",
  600: "#475569",
  500: "#64748b",
  400: "#94a3b8",
  300: "#cbd5e1",
  200: "#e2e8f0",
  100: "#f1f5f9",
  50: "#f8fafc",
} as const;

// ─── Surface tokens ──────────────────────────────────────────────
export const surface = {
  canvas: sl[50],       // page background — reduces eye strain
  card: "#ffffff",      // elevated surfaces (cards, panels)
  inset: sl[100],       // inputs, alternate rows — "receives content"
  border: "rgba(15,23,42,0.09)",
  borderMid: "rgba(15,23,42,0.16)",
  borderStrong: "rgba(15,23,42,0.24)",
} as const;

// ─── Text tokens ─────────────────────────────────────────────────
export const ink = {
  primary: sl[900],
  secondary: sl[500],
  tertiary: sl[400],
} as const;

// ─── Semantic colors (status indicators ONLY) ────────────────────
export const semantic = {
  danger:  { fg: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  warning: { fg: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  success: { fg: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  info:    { fg: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
} as const;

// ─── Status colors — order states ────────────────────────────────
export const statusColor: Record<string, string> = {
  PENDING:   semantic.danger.fg,
  APPROVED:  semantic.warning.fg,
  READY:     "#b45309",
  SHIPPED:   semantic.success.fg,
  COMPLETED: sl[500],
  DENIED:    sl[400],
  CANCELED:  sl[400],
};
