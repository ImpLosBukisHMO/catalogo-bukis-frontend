import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";
import { getLoggedUserData } from "../services/user";

vi.mock("../services/user", () => ({
  getLoggedUserData: vi.fn(),
}));

function AuthProbe() {
  const { isLoggedIn, setLoggedOut } = useAuth();

  return (
    <>
      <div>{isLoggedIn ? "logged-in" : "logged-out"}</div>
      <button type="button" onClick={setLoggedOut}>logout</button>
    </>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getLoggedUserData).mockRejectedValue({ response: { status: 401 } });
  });

  it("does not bootstrap an authenticated session from the legacy token key alone", () => {
    localStorage.setItem("token", "legacy-token");
    localStorage.setItem("me", JSON.stringify({ is_staff: true }));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(screen.getByText("logged-out")).toBeInTheDocument();
  });

  it("clears JWT state and purges legacy token leftovers when logging out", () => {
    localStorage.setItem("access", "jwt-access");
    localStorage.setItem("refresh", "jwt-refresh");
    localStorage.setItem("token", "legacy-token");
    localStorage.setItem("me", JSON.stringify({ is_staff: false }));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(localStorage.getItem("me")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByText("logged-out")).toBeInTheDocument();
  });
});
