/**
 * WorkerDropdown — Radix Dropdown Menu primitives wrapped with worker token styling.
 *
 * Portal strategy: same as WorkerDialog — the worker-overlay-portal class
 * re-declares worker CSS variables so tokens work inside the Radix portal.
 *
 * Keyboard behavior (delegated to Radix):
 *   - Arrow keys: navigate items
 *   - Enter/Space: activate item
 *   - Escape: close menu
 *   - Tab: close menu and move focus
 *   - Disabled items: not activatable via keyboard or pointer
 *
 * Usage:
 *   <WorkerDropdownRoot>
 *     <WorkerDropdownTrigger asChild><button>Menu</button></WorkerDropdownTrigger>
 *     <WorkerDropdownContent>
 *       <WorkerDropdownLabel>Section label</WorkerDropdownLabel>
 *       <WorkerDropdownItem onSelect={() => {}}>Action</WorkerDropdownItem>
 *       <WorkerDropdownSeparator />
 *       <WorkerDropdownItem destructive onSelect={() => {}}>Danger</WorkerDropdownItem>
 *     </WorkerDropdownContent>
 *   </WorkerDropdownRoot>
 */

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { type ReactNode, type CSSProperties } from "react";
import { useWorkerTheme } from "../../providers/useWorkerTheme";

// ─── Root & Trigger (thin pass-throughs) ─────────────────────────────────────

export const WorkerDropdownRoot = RadixDropdown.Root;
export const WorkerDropdownTrigger = RadixDropdown.Trigger;

// ─── Content with worker token re-injection ───────────────────────────────────

type WorkerDropdownContentProps = {
  children: ReactNode;
  /** Alignment relative to trigger (default: "end") */
  align?: "start" | "center" | "end";
  /** Side offset in px (default: 6) */
  sideOffset?: number;
};

export const WorkerDropdownContent = ({
  children,
  align = "end",
  sideOffset = 6,
}: WorkerDropdownContentProps) => {
  const { theme } = useWorkerTheme();

  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        className="worker-overlay-portal"
        data-worker-theme={theme}
        align={align}
        sideOffset={sideOffset}
        style={{
          minWidth: "180px",
          backgroundColor: "var(--worker-overlay)",
          border: "1px solid var(--worker-border-strong)",
          borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(15,23,42,0.14)",
          padding: "4px 0",
          zIndex: 9999,
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontVariantNumeric: "tabular-nums",
          transformOrigin: "var(--radix-dropdown-menu-content-transform-origin)",
          // Radix animates via data-state; keep subtle without full animation setup
        } as CSSProperties}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
};

// ─── Label ───────────────────────────────────────────────────────────────────

type WorkerDropdownLabelProps = { children: ReactNode };

export const WorkerDropdownLabel = ({ children }: WorkerDropdownLabelProps) => (
  <RadixDropdown.Label
    style={{
      padding: "4px 12px 2px",
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--worker-ink-muted)",
      userSelect: "none",
    }}
  >
    {children}
  </RadixDropdown.Label>
);

// ─── Item ─────────────────────────────────────────────────────────────────────

type WorkerDropdownItemProps = {
  children: ReactNode;
  onSelect?: (event: Event) => void;
  disabled?: boolean;
  /**
   * Destructive items render in error-red. Use for logout, deny, delete actions.
   * Color is supported by an additional label or icon — not color alone.
   */
  destructive?: boolean;
  icon?: ReactNode;
};

export const WorkerDropdownItem = ({
  children,
  onSelect,
  disabled = false,
  destructive = false,
  icon,
}: WorkerDropdownItemProps) => {
  const textColor = destructive
    ? "var(--worker-error-fg)"
    : "var(--worker-ink)";

  return (
    <RadixDropdown.Item
      disabled={disabled}
      onSelect={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        fontSize: "14px",
        fontWeight: 400,
        color: disabled ? "var(--worker-ink-muted)" : textColor,
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        userSelect: "none",
        borderRadius: "6px",
        margin: "0 4px",
      }}
      onFocus={(e) => {
        if (!disabled) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.backgroundColor = destructive
            ? "var(--worker-error-bg)"
            : "var(--worker-bench)";
          el.style.color = disabled ? "var(--worker-ink-muted)" : textColor;
        }
      }}
      onBlur={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.backgroundColor = "transparent";
      }}
      // Radix also handles highlight via data-highlighted; mirror via CSS
      data-destructive={destructive ? "true" : undefined}
    >
      {icon && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            width: "16px",
            height: "16px",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      )}
      {children}
    </RadixDropdown.Item>
  );
};

// ─── Separator ───────────────────────────────────────────────────────────────

export const WorkerDropdownSeparator = () => (
  <RadixDropdown.Separator
    style={{
      height: "1px",
      backgroundColor: "var(--worker-border-soft)",
      margin: "4px 0",
    }}
  />
);
