/**
 * WorkerDialog — Radix Dialog primitives wrapped with worker token styling.
 *
 * Portal strategy: Radix portals content to <body>, outside .worker-scope.
 * The worker-overlay-portal class re-declares all worker CSS variables so
 * token references inside the portal resolve correctly in both themes.
 *
 * Usage:
 *   <WorkerDialogRoot open={open} onOpenChange={setOpen}>
 *     <WorkerDialogTrigger asChild><button>Open</button></WorkerDialogTrigger>
 *     <WorkerDialogContent data-worker-theme={theme}>
 *       <WorkerDialogHeader>
 *         <WorkerDialogTitle>Title</WorkerDialogTitle>
 *         <WorkerDialogDescription>Description</WorkerDialogDescription>
 *       </WorkerDialogHeader>
 *       <WorkerDialogFooter>
 *         <WorkerDialogCancel>Cancel</WorkerDialogCancel>
 *         <WorkerDialogAction>Confirm</WorkerDialogAction>
 *       </WorkerDialogFooter>
 *     </WorkerDialogContent>
 *   </WorkerDialogRoot>
 */

import * as RadixDialog from "@radix-ui/react-dialog";
import { type ReactNode } from "react";
import { useWorkerTheme } from "../../providers/useWorkerTheme";

// ─── Root & Trigger (thin pass-throughs) ─────────────────────────────────────

export const WorkerDialogRoot = RadixDialog.Root;
export const WorkerDialogTrigger = RadixDialog.Trigger;
export const WorkerDialogClose = RadixDialog.Close;

// ─── Portal content with worker token re-injection ───────────────────────────

type WorkerDialogContentProps = {
  children: ReactNode;
  /** Extra class names for the content panel itself. */
  className?: string;
  /**
   * Optional destructive variant — renders the rail accent in error-red instead
   * of the normal rail color. Use for deny/cancel/delete confirmations.
   */
  destructive?: boolean;
  size?: "md" | "lg";
  layout?: "dialog" | "adaptive";
};

export const WorkerDialogContent = ({
  children,
  className = "",
  destructive = false,
  size = "md",
  layout = "dialog",
}: WorkerDialogContentProps) => {
  const { theme } = useWorkerTheme();
  const panelClassName = [
    "worker-overlay-portal",
    "worker-dialog-content",
    `worker-dialog-content--${size}`,
    layout === "adaptive" ? "worker-dialog-content--adaptive" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <RadixDialog.Portal>
      {/* Overlay */}
      <RadixDialog.Overlay
        className="worker-overlay-portal worker-dialog-overlay"
        data-worker-theme={theme}
      />

      {/* Content panel */}
      <RadixDialog.Content
        className={panelClassName}
        data-worker-theme={theme}
      >
        {/* Fulfillment rail accent — top border strip */}
        <div
          style={{
            height: "3px",
            background: destructive
              ? "var(--worker-error-fg)"
              : "var(--worker-rail)",
            flexShrink: 0,
          }}
        />
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
};

// ─── Header ──────────────────────────────────────────────────────────────────

type WorkerDialogHeaderProps = {
  children: ReactNode;
  className?: string;
};

export const WorkerDialogHeader = ({ children, className = "" }: WorkerDialogHeaderProps) => (
  <div
    className={["worker-dialog-header", className].filter(Boolean).join(" ")}
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    }}
  >
    {children}
  </div>
);

// ─── Title ───────────────────────────────────────────────────────────────────

type WorkerDialogTitleProps = { children: ReactNode };

export const WorkerDialogTitle = ({ children }: WorkerDialogTitleProps) => (
  <RadixDialog.Title
    style={{
      margin: 0,
      fontSize: "16px",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      color: "var(--worker-ink)",
      lineHeight: 1.3,
    }}
  >
    {children}
  </RadixDialog.Title>
);

// ─── Description ─────────────────────────────────────────────────────────────

type WorkerDialogDescriptionProps = { children: ReactNode };

export const WorkerDialogDescription = ({
  children,
}: WorkerDialogDescriptionProps) => (
  <RadixDialog.Description
    style={{
      margin: 0,
      fontSize: "14px",
      color: "var(--worker-ink-secondary)",
      lineHeight: 1.5,
    }}
  >
    {children}
  </RadixDialog.Description>
);

// ─── Body (optional generic slot between header/footer) ──────────────────────

type WorkerDialogBodyProps = {
  children: ReactNode;
  scrollable?: boolean;
  className?: string;
};

export const WorkerDialogBody = ({
  children,
  scrollable = false,
  className = "",
}: WorkerDialogBodyProps) => (
  <div
    className={[
      "worker-dialog-body",
      scrollable ? "worker-dialog-body--scrollable" : "",
      className,
    ].filter(Boolean).join(" ")}
    style={{
      color: "var(--worker-ink)",
    }}
  >
    {children}
  </div>
);

// ─── Footer ──────────────────────────────────────────────────────────────────

type WorkerDialogFooterProps = {
  children: ReactNode;
  className?: string;
};

export const WorkerDialogFooter = ({ children, className = "" }: WorkerDialogFooterProps) => (
  <div
    className={["worker-dialog-footer", className].filter(Boolean).join(" ")}
    style={{
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
    }}
  >
    {children}
  </div>
);

// ─── Cancel button ───────────────────────────────────────────────────────────

type WorkerDialogCancelProps = {
  children: ReactNode;
  onClick?: () => void;
};

export const WorkerDialogCancel = ({
  children,
  onClick,
}: WorkerDialogCancelProps) => (
  <RadixDialog.Close asChild>
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--worker-ink-secondary)",
        backgroundColor: "var(--worker-bench)",
        border: "1px solid var(--worker-border)",
        borderRadius: "6px",
        cursor: "pointer",
        lineHeight: 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          "var(--worker-control-bg)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          "var(--worker-bench)";
      }}
    >
      {children}
    </button>
  </RadixDialog.Close>
);

// ─── Action button (primary confirm) ─────────────────────────────────────────

type WorkerDialogActionProps = {
  children: ReactNode;
  onClick?: () => void;
  /** Destructive styling: error-red background for deny/cancel/delete actions. */
  destructive?: boolean;
  disabled?: boolean;
};

export const WorkerDialogAction = ({
  children,
  onClick,
  destructive = false,
  disabled = false,
}: WorkerDialogActionProps) => {
  const bg = destructive ? "var(--worker-error-fg)" : "var(--worker-rail)";
  const bgHover = destructive
    ? "var(--worker-error-fg)"
    : "var(--worker-rail-hover)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 18px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#ffffff",
        backgroundColor: disabled ? "var(--worker-ink-muted)" : bg,
        border: "none",
        borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
        lineHeight: 1,
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            bgHover;
      }}
      onMouseLeave={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = bg;
      }}
    >
      {children}
    </button>
  );
};
