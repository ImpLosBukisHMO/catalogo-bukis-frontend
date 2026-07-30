import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfirmAccountPage from "./ConfirmAccountPage";
import { confirmAccount, reenviarConfirmacion } from "../../services/auth";
import { getLoggedUserData } from "../../services/user";

// ─── Mocks de layout ──────────────────────────────────────────────────────────
vi.mock("../elements/NavBar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../elements/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

// ─── Mocks de servicios ───────────────────────────────────────────────────────
vi.mock("../../services/auth", () => ({
  confirmAccount: vi.fn(),
  reenviarConfirmacion: vi.fn(),
}));

vi.mock("../../services/user", () => ({
  getLoggedUserData: vi.fn(),
}));

const mockedConfirmAccount = vi.mocked(confirmAccount);
const mockedReenviarConfirmacion = vi.mocked(reenviarConfirmacion);
const mockedGetLoggedUserData = vi.mocked(getLoggedUserData);

// ─── Helper de renderizado ────────────────────────────────────────────────────
function renderPage() {
  return render(
    <MemoryRouter>
      <ConfirmAccountPage />
    </MemoryRouter>,
  );
}

// =============================================================================
describe("ConfirmAccountPage", () => {
  beforeEach(() => {
    // Usuario no autenticado por defecto
    mockedGetLoggedUserData.mockRejectedValue({ response: { status: 401 } });
    mockedConfirmAccount.mockReset();
    mockedReenviarConfirmacion.mockReset();
  });

  // ── Renderizado básico ─────────────────────────────────────────────────────
  it("renders the confirmation form with email and code inputs", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /Confirmar Cuenta/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/usuario@correo\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/123456/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar Cuenta/i }),
    ).toBeInTheDocument();
  });

  it("shows the resend-code button on the idle form", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: /Necesitas otro código/i }),
    ).toBeInTheDocument();
  });

  // ── Confirmación exitosa ───────────────────────────────────────────────────
  it("shows the success screen when the code is correct", async () => {
    mockedConfirmAccount.mockResolvedValue({
      mensaje: "Cuenta confirmada exitosamente.",
    });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/usuario@correo\.com/i), {
      target: { value: "juan@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/123456/i), {
      target: { value: "654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirmar Cuenta/i }));

    expect(
      await screen.findByRole("heading", { name: /Cuenta Confirmada/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cuenta confirmada exitosamente/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Iniciar Sesión/i }),
    ).toHaveAttribute("href", "/iniciar-sesion");
  });

  it("calls confirmAccount with the email and code entered by the user", async () => {
    mockedConfirmAccount.mockResolvedValue({ mensaje: "ok" });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/usuario@correo\.com/i), {
      target: { value: "ana@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/123456/i), {
      target: { value: "112233" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirmar Cuenta/i }));

    await waitFor(() => {
      expect(mockedConfirmAccount).toHaveBeenCalledWith("ana@test.com", "112233");
    });
  });

  // ── Código sólo acepta dígitos ─────────────────────────────────────────────
  it("strips non-numeric characters from the code field", () => {
    renderPage();

    const codeInput = screen.getByPlaceholderText(/123456/i) as HTMLInputElement;
    fireEvent.change(codeInput, { target: { value: "abc12x3" } });

    expect(codeInput.value).toBe("123");
  });

  // ── Error de confirmación ──────────────────────────────────────────────────
  it("shows the error panel with resend form when confirmation fails", async () => {
    mockedConfirmAccount.mockRejectedValue(
      new Error("El código de verificación es incorrecto."),
    );

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/usuario@correo\.com/i), {
      target: { value: "juan@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/123456/i), {
      target: { value: "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirmar Cuenta/i }));

    expect(
      await screen.findByRole("heading", { name: /Error al confirmar/i }),
    ).toBeInTheDocument();
    // El formulario de reenvío debe aparecer automáticamente
    expect(screen.getByPlaceholderText(/Ingresa tu correo/i)).toBeInTheDocument();
    // El email del intento fallido se pre-rellena en el campo de reenvío
    expect(
      (screen.getByPlaceholderText(/Ingresa tu correo/i) as HTMLInputElement).value,
    ).toBe("juan@example.com");
  });

  // ── Reenvío de código ─────────────────────────────────────────────────────
  it("shows the resend form when the user clicks the resend button", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: /Necesitas otro código/i }),
    );

    expect(
      await screen.findByPlaceholderText(/Ingresa tu correo/i),
    ).toBeInTheDocument();
  });

  it("shows a success message after a successful resend", async () => {
    mockedReenviarConfirmacion.mockResolvedValue({
      mensaje: "Se ha reenviado el correo de confirmación exitosamente.",
    });

    renderPage();

    // Abrir el panel de reenvío
    fireEvent.click(
      screen.getByRole("button", { name: /Necesitas otro código/i }),
    );

    const resendInput = await screen.findByPlaceholderText(/Ingresa tu correo/i);
    fireEvent.change(resendInput, { target: { value: "pedro@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Reenviar código/i }));

    expect(
      await screen.findByText(/Se ha reenviado el correo/i),
    ).toBeInTheDocument();
    expect(mockedReenviarConfirmacion).toHaveBeenCalledWith("pedro@test.com");
  });

  it("shows an error message when the resend fails", async () => {
    mockedReenviarConfirmacion.mockRejectedValue(
      new Error("Esta cuenta ya se encuentra verificada."),
    );

    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: /Necesitas otro código/i }),
    );

    const resendInput = await screen.findByPlaceholderText(/Ingresa tu correo/i);
    fireEvent.change(resendInput, { target: { value: "ya@verificado.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Reenviar código/i }));

    expect(
      await screen.findByText(/Esta cuenta ya se encuentra verificada/i),
    ).toBeInTheDocument();
  });

  // ── No enviar si faltan campos ────────────────────────────────────────────
  it("does not call confirmAccount if email or code is empty", async () => {
    renderPage();

    // Solo rellena el correo, deja el código vacío (el input tiene 'required')
    fireEvent.change(screen.getByPlaceholderText(/usuario@correo\.com/i), {
      target: { value: "test@test.com" },
    });
    // El submit con campos vacíos es bloqueado por el atributo 'required' del navegador,
    // pero nuestra guardia explícita también actúa cuando ambos son vacíos al mismo tiempo.
    // Aquí verificamos que el servicio no se llame.
    fireEvent.click(screen.getByRole("button", { name: /Confirmar Cuenta/i }));

    // waitFor un pequeño tiempo para asegurar que no se llamó
    await waitFor(() => {
      expect(mockedConfirmAccount).not.toHaveBeenCalled();
    });
  });
});
