"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

export default function RegistroPage() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<UserRole>("inversor");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { signUp } = useAuth();
  const router     = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setLoading(true);
    try {
      await signUp(email, password, name, role);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("email-already-in-use")) {
        setError("Ese email ya está registrado.");
      } else {
        setError("Error al registrarse. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
         style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,154,0,0.08), transparent 60%), #0A0A0A" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo-brand.png" alt="Mercado Token" width={180} height={60}
                 style={{ objectFit: "contain", height: 52, width: "auto", margin: "0 auto 16px" }} />
          <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>Marketplace Global de Activos Tokenizados</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h1 className="text-xl font-bold mb-6 text-white">Crear cuenta</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Nombre completo</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                     placeholder="Juan García"
                     className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                     style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                     onFocus={e => e.target.style.borderColor = "var(--copper)"}
                     onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                     placeholder="nombre@empresa.com"
                     className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                     style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                     onFocus={e => e.target.style.borderColor = "var(--copper)"}
                     onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                     placeholder="Mínimo 6 caracteres"
                     className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                     style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                     onFocus={e => e.target.style.borderColor = "var(--copper)"}
                     onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: "#A1A1AA" }}>Tipo de cuenta</label>
              <div className="grid grid-cols-2 gap-3">
                {(["inversor", "emisor"] as UserRole[]).map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                          className="py-3 px-4 rounded-lg text-sm font-semibold transition"
                          style={{
                            background: role === r ? "linear-gradient(135deg, #FF9A00, #D4AF37)" : "#161616",
                            color: role === r ? "#000" : "#A1A1AA",
                            border: role === r ? "none" : "1px solid rgba(255,255,255,0.07)",
                          }}>
                    {r === "inversor" ? "🌍 Inversor" : "🏢 Emisor"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs" style={{ color: "#6B6358" }}>
                {role === "inversor"
                  ? "Accedé a activos tokenizados y construí tu portafolio."
                  : "Traé tus activos reales para tokenizarlos en la plataforma."}
              </p>
            </div>

            <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-lg font-bold text-sm mt-2"
                    style={{ background: loading ? "#555" : "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "#A1A1AA" }}>
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" style={{ color: "var(--gold-light)" }} className="font-semibold">
              Ingresá
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
