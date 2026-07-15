import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PaginationControls from "./PaginationControls";

describe("PaginationControls", () => {
  it("renders the current page label and preserves query params in navigation links", () => {
    render(
      <MemoryRouter>
        <PaginationControls
          page={2}
          count={83}
          hasPrevious
          hasNext
          query="libro"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "/productos?page=1&query=libro",
    );
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/productos?page=3&query=libro",
    );
  });

  it("disables previous navigation on the first page", () => {
    render(
      <MemoryRouter>
        <PaginationControls page={1} count={83} hasPrevious={false} hasNext query="" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/productos?page=2");
  });

  it("disables next navigation on the last page", () => {
    render(
      <MemoryRouter>
        <PaginationControls page={3} count={60} hasPrevious hasNext={false} query="mate" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "/productos?page=2&query=mate",
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
});
