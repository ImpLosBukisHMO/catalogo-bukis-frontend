import { Link } from "react-router-dom";
import {
  buildCatalogLocation,
  PUBLIC_PRODUCTS_PAGE_SIZE,
} from "../../utils/catalogNavigation";

type PaginationControlsProps = {
  ariaLabel?: string;
  page: number;
  count: number;
  hasPrevious: boolean;
  hasNext: boolean;
  query?: string;
};

function controlClassName(disabled: boolean): string {
  return [
    "inline-flex min-w-28 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition",
    disabled
      ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
      : "border-bukis-red-800 bg-bukis-red-600 text-white hover:bg-bukis-red-700 focus:outline-none focus:ring-2 focus:ring-bukis-red-600/35",
  ].join(" ");
}

export default function PaginationControls({
  ariaLabel = "Catalog pagination",
  page,
  count,
  hasPrevious,
  hasNext,
  query = "",
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(count / PUBLIC_PRODUCTS_PAGE_SIZE));

  return (
    <nav
      className="mt-8 flex flex-col items-center justify-center gap-3 border-t border-neutral-200 pt-6 sm:flex-row"
      aria-label={ariaLabel}
    >
      {hasPrevious ? (
        <Link
          to={buildCatalogLocation({ page: page - 1, query })}
          aria-label="Previous page"
          className={controlClassName(false)}
        >
          Previous
        </Link>
      ) : (
        <button type="button" aria-label="Previous page" className={controlClassName(true)} disabled>
          Previous
        </button>
      )}

      <p className="text-sm font-medium text-neutral-700">Page {page} of {totalPages}</p>

      {hasNext ? (
        <Link
          to={buildCatalogLocation({ page: page + 1, query })}
          aria-label="Next page"
          className={controlClassName(false)}
        >
          Next
        </Link>
      ) : (
        <button type="button" aria-label="Next page" className={controlClassName(true)} disabled>
          Next
        </button>
      )}
    </nav>
  );
}
