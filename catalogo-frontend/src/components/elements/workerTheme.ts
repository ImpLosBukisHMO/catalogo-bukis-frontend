/**
 * Worker Panel — Design Tokens
 * Importaciones Los Bukis
 *
 * Color role separation:
 *   brand red   → identity, selection (sidebar active, selected row)
 *   dark slate  → primary action buttons (save, confirm, submit)
 *   danger red  → destructive actions only (deny order)
 *   semantics   → status indicators only, never on buttons or structure
 *   table heads → dark slate, never brand/semantic colors
 */
import type { CSSProperties } from "react";

// ─── Brand ───────────────────────────────────────────────────────
export const brand = "#dd0000"; // Importaciones Los Bukis

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

// ─── Spacing (multiples of 4) ────────────────────────────────────
export const sp = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  "2xl": 24,
  "3xl": 32,
} as const;

// ─── Border radius ───────────────────────────────────────────────
export const r = { sm: 6, md: 8, lg: 12 } as const;

// ─── Typography ──────────────────────────────────────────────────
export const typo = {
  pageTitle: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: sl[900],
    margin: 0,
  } as CSSProperties,
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: sl[900],
    margin: 0,
  } as CSSProperties,
  subtitle: {
    fontSize: 14,
    color: sl[500],
    margin: "4px 0 0",
  } as CSSProperties,
  label: {
    fontSize: 12,
    color: sl[500],
    fontWeight: 500,
  } as CSSProperties,
  small: { fontSize: 13, color: sl[500] } as CSSProperties,
  micro: { fontSize: 12, color: sl[400] } as CSSProperties,
};

// ─── Card ────────────────────────────────────────────────────────
export const card: CSSProperties = {
  backgroundColor: surface.card,
  border: `1px solid ${surface.border}`,
  borderRadius: r.lg,
  padding: `${sp.xl}px ${sp["2xl"]}px`,
};

// ─── Buttons ─────────────────────────────────────────────────────
const btnBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: sp.sm,
  padding: `${sp.sm}px ${sp.lg}px`,
  borderRadius: r.md,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  border: "none",
  lineHeight: "1.4",
};

export const btn = {
  /** Primary actions: save, confirm, submit */
  primary: {
    ...btnBase,
    background: sl[900],
    color: "#fff",
  } as CSSProperties,

  /** Secondary/neutral: cancel, close, print */
  secondary: {
    ...btnBase,
    background: surface.card,
    color: sl[700],
    border: `1px solid ${surface.borderMid}`,
  } as CSSProperties,

  /** Destructive only: deny order, delete */
  danger: {
    ...btnBase,
    background: semantic.danger.fg,
    color: "#fff",
  } as CSSProperties,

  /** Icon-only or inline ghost actions */
  ghost: {
    ...btnBase,
    background: "none",
    color: sl[500],
    border: "none",
    padding: `${sp.sm}px`,
    fontSize: 18,
  } as CSSProperties,

  /** Disabled state — apply when loading */
  disabled: {
    ...btnBase,
    background: sl[200],
    color: sl[400],
    cursor: "not-allowed",
  } as CSSProperties,
};

// ─── Form control ────────────────────────────────────────────────
export const control: CSSProperties = {
  padding: "7px 10px",
  borderRadius: r.sm,
  border: `1px solid ${surface.borderMid}`,
  fontSize: 13,
  backgroundColor: surface.inset,
  color: sl[900],
  width: "100%",
  boxSizing: "border-box",
};

// ─── Page header row ─────────────────────────────────────────────
export const pageHeaderRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: sp["2xl"],
};

// ─── Table header cell ───────────────────────────────────────────
export const tableHead: CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 13,
  whiteSpace: "nowrap",
  background: sl[800],
  color: "#fff",
};
