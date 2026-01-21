import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/auth";

export default function LoginPage() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      // 🔑 aquí ya se guardan access y refresh
      await login(correo, contrasena);

      navigate("/worker");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "80px auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        Iniciar sesión
      </h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        {error && (
          <p style={{ color: "red", marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10 }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
