import { beforeEach, describe, expect, it, vi } from "vitest";
import { logout } from "./auth";

describe("auth.logout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clears JWT auth state, purges legacy token leftovers, and calls the auth-clear callback", () => {
    localStorage.setItem("access", "jwt-access");
    localStorage.setItem("refresh", "jwt-refresh");
    localStorage.setItem("me", JSON.stringify({ id: 1 }));
    localStorage.setItem("token", "legacy-token");
    const onClearAuth = vi.fn();

    logout(onClearAuth);

    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(localStorage.getItem("me")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(onClearAuth).toHaveBeenCalledTimes(1);
  });

  it("supports an optional navigation callback after client-side logout", () => {
    const onClearAuth = vi.fn();
    const navigate = vi.fn();

    logout(onClearAuth, navigate);

    expect(onClearAuth).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
