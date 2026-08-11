import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WorkerSidebar from "./WorkerSidebar";
import { logout } from "../../services/auth";

const mockedNavigate = vi.fn();
const mockedSetLoggedOut = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

vi.mock("../../services/auth", () => ({
  logout: vi.fn(),
}));

vi.mock("../../context/useAuth", () => ({
  useAuth: () => ({ setLoggedOut: mockedSetLoggedOut }),
}));

vi.mock("../providers/useWorkerTheme", () => ({
  useWorkerTheme: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));

vi.mock("../../utils/featureFlags", () => ({
  isBannerOfertasEnabled: () => false,
}));

vi.mock("../ui/worker/WorkerDropdown", () => ({
  WorkerDropdownRoot: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  WorkerDropdownTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  WorkerDropdownContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  WorkerDropdownItem: ({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) => (
    <button type="button" onClick={onSelect}>{children}</button>
  ),
  WorkerDropdownSeparator: () => <div />,
  WorkerDropdownLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("WorkerSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the shared JWT-only logout path with auth clearing and redirect callbacks", () => {
    render(
      <MemoryRouter>
        <WorkerSidebar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(logout).toHaveBeenCalledTimes(1);
    const [onClearAuth, navigate] = vi.mocked(logout).mock.calls[0];
    expect(onClearAuth).toBe(mockedSetLoggedOut);
    expect(typeof navigate).toBe("function");
  });
});
