import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NavBar from "./NavBar";
import { logout } from "../../services/auth";

const mockedSetLoggedOut = vi.fn();
const authState = {
  isLoggedIn: false,
  isStaff: false,
  setLoggedOut: mockedSetLoggedOut,
};

vi.mock("../../context/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("../../services/auth", () => ({
  logout: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isLoggedIn = false;
    authState.isStaff = false;
  });

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

  it("uses the shared JWT-only logout flow when an authenticated user signs out", () => {
    authState.isLoggedIn = true;

    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavBar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar Sesión" }));

    expect(logout).toHaveBeenCalledTimes(1);
    const [onClearAuth, navigate] = vi.mocked(logout).mock.calls[0];
    expect(onClearAuth).toBe(mockedSetLoggedOut);
    expect(typeof navigate).toBe("function");
  });
});
