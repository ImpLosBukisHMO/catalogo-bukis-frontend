import { X } from "lucide-react";

export function PlaceholderSlide() {
  return (
    <div
      role="img"
      aria-label="Sin ofertas activas"
      className="flex h-[360px] w-full items-center justify-center bg-neutral-200 text-neutral-500"
    >
      <X className="h-20 w-20" strokeWidth={1.5} />
    </div>
  );
}
