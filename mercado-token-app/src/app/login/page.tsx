"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { signIn } = useAuth();
  const router     = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,154,0,0.08), transparent 60%), #0A0A0A" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo-brand.png" alt="Mercado Token" width={180} height={60}
                 style={{ objectFit: "contain", height: 52, width: "auto", margin: "0 auto 16px" }} />
          <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>Marketplace Global de Activos Tokenizados</p>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h1 className="text-xl font-bold mb-6 text-white">Ingresar a tu cuenta</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                     placeholder="nombre@empresa.com"
                     className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition"
                     style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                     onFocus={e => e.target.style.borderColor = "var(--copper)"}
                     onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                     placeholder="••••••••"
                     className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none transition"
                     style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                     onFocus={e => e.target.style.borderColor = "var(--copper)"}
                     onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
            </div>

            <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-lg font-bold text-sm transition mt-2"
                    style={{ background: loading ? "#555" : "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "#A1A1AA" }}>
            ¿No tenés cuenta?{" "}
            <Link href="/registro" style={{ color: "var(--gold-light)" }} className="font-semibold">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
