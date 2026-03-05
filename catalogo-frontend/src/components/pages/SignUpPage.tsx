import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "", apellido: "", correo: "", telefono: "", password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#ef4444", margin: 0 }}>Crear cuenta</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {([
            { k: "nombre",   label: "Nombre(s)",   type: "text" },
            { k: "apellido", label: "Apellido(s)",  type: "text" },
            { k: "correo",   label: "Correo",       type: "email" },
            { k: "telefono", label: "Teléfono",     type: "tel" },
            { k: "password", label: "Contraseña",   type: "password" },
          ] as const).map(({ k, label, type }) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</label>
              <input type={type} value={form[k]} onChange={set(k)} required
                style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }} />
            </div>
          ))}
          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ marginTop: 4, padding: 11, borderRadius: 8, border: "none", background: loading ? "#9ca3af" : "#ef4444", color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Registrando…" : "Crear cuenta"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#6b7280" }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={{ color: "#ef4444", fontWeight: 600 }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
