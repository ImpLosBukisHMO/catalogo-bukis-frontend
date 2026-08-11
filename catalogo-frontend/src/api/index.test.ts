import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/auth", async () => {
  const actual = await vi.importActual<typeof import("../services/auth")>("../services/auth");

  return {
    ...actual,
    refreshAccessToken: vi.fn(),
    logout: vi.fn(actual.logout),
  };
});

import API from "./index";
import { logout, refreshAccessToken } from "../services/auth";

const requestHandlers = (API.interceptors.request as unknown as { handlers: Array<{ fulfilled: unknown }> }).handlers;
const responseHandlers = (API.interceptors.response as unknown as { handlers: Array<{ rejected: unknown }> }).handlers;
const requestFulfilled = requestHandlers[0].fulfilled as (config: { headers: Record<string, string> }) => { headers: Record<string, string> };
const responseRejected = responseHandlers[0].rejected as (error: { response?: { status?: number; data?: { code?: string } }; config: { headers: Record<string, string>; _retry?: boolean } }) => Promise<unknown>;

describe("API interceptors", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("attaches Authorization only from the JWT access key", () => {
    localStorage.setItem("token", "legacy-token");
    const legacyOnlyConfig = requestFulfilled({ headers: {} });
    expect(legacyOnlyConfig.headers.Authorization).toBeUndefined();

    localStorage.setItem("access", "jwt-access");
    const jwtConfig = requestFulfilled({ headers: {} });
    expect(jwtConfig.headers.Authorization).toBe("Bearer jwt-access");
  });

  it("drops stale access plus legacy token on token_not_valid and retries without Authorization", async () => {
    localStorage.setItem("access", "stale-access");
    localStorage.setItem("token", "legacy-token");

    const adapter = vi.fn().mockResolvedValue({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: {} },
    });
    API.defaults.adapter = adapter;

    await responseRejected({
      response: { status: 401, data: { code: "token_not_valid" } },
      config: { headers: { Authorization: "Bearer stale-access" } },
    });

    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });

  it("refreshes once for other 401 responses and retries with the new Bearer token", async () => {
    localStorage.setItem("access", "stale-access");
    vi.mocked(refreshAccessToken).mockImplementation(async () => {
      localStorage.setItem("access", "fresh-access");
      return "fresh-access";
    });

    const adapter = vi.fn().mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: {} },
    });
    API.defaults.adapter = adapter;

    await responseRejected({
      response: { status: 401, data: { code: "some_other_401" } },
      config: { headers: { Authorization: "Bearer stale-access" } },
    });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(adapter.mock.calls[0]?.[0]?.headers?.Authorization).toBe("Bearer fresh-access");
    expect(logout).not.toHaveBeenCalled();
  });

  it("runs the logout cleanup path when token refresh fails", async () => {
    localStorage.setItem("access", "stale-access");
    localStorage.setItem("refresh", "stale-refresh");
    localStorage.setItem("me", JSON.stringify({ id: 1 }));
    localStorage.setItem("token", "legacy-token");
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error("refresh failed"));

    await expect(
      responseRejected({
        response: { status: 401, data: { code: "expired" } },
        config: { headers: { Authorization: "Bearer stale-access" } },
      }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(localStorage.getItem("me")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
