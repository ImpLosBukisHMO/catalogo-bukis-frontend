import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import NavBar from "./NavBar";

vi.mock("../../context/useAuth", () => ({
  useAuth: () => ({
    isLoggedIn: false,
    isStaff: false,
    setLoggedOut: vi.fn(),
  }),
}));

vi.mock("../../services/user", () => ({
  logOut: vi.fn(),
}));

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderNavBar() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <NavBar />
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NavBar", () => {
  it("navigates to the canonical catalog route when a search is submitted", () => {
    renderNavBar();

    fireEvent.change(screen.getByPlaceholderText("Busque un producto"), {
      target: { value: "  mate imperial  " },
    });
    fireEvent.submit(screen.getByRole("searchbox").closest("form") as HTMLFormElement);

    expect(screen.getByTestId("location")).toHaveTextContent("/productos?page=1&query=mate+imperial");
  });

  it("navigates to the first catalog page when the search is empty", () => {
    renderNavBar();

    fireEvent.submit(screen.getByRole("searchbox").closest("form") as HTMLFormElement);

    expect(screen.getByTestId("location")).toHaveTextContent("/productos?page=1");
  });
});
