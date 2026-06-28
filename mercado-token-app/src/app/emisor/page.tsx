"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { SECTORS } from "@/lib/constants";

export default function EmisorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", sector: "", location: "", totalValue: "", tokenPrice: "", description: ""
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "emisor") router.push("/dashboard");
  }, [user, loading, router]);

  if (loading || !user) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setShowForm(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-4xl mx-auto">

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Panel Emisor</h1>
          <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>Gestioná tus activos en tokenización</p>
        </div>

        {submitted && (
          <div className="mb-6 p-5 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div className="font-semibold text-white mb-1">✅ Solicitud enviada correctamente</div>
            <div className="text-sm" style={{ color: "#A1A1AA" }}>El equipo de Mercado Token revisará tu activo y te contactará en 48-72hs hábiles.</div>
          </div>
        )}

        {/* Stats emisor */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Activos enviados",  value: submitted ? "1" : "0" },
            { label: "En revisión",        value: submitted ? "1" : "0", color: "#F59E0B" },
            { label: "Tokens emitidos",    value: "0" },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-xs mb-1" style={{ color: "#6B6358", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
              <div className="text-2xl font-bold" style={{ color: s.color ?? "var(--gold-light)" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Proceso */}
        <div className="p-5 rounded-xl mb-8" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="font-bold text-white mb-4">¿Cómo funciona la tokenización?</h2>
          <div className="flex flex-col gap-3">
            {[
              { n: "01", text: "Cargás tu activo con documentación y valoración" },
              { n: "02", text: "Mercado Token estructura y revisa la tokenización" },
              { n: "03", text: "Se emiten tokens via smart contract auditado" },
              { n: "04", text: "El activo aparece en el marketplace para inversores" },
              { n: "05", text: "Administrás rendimientos y comunicaciones desde acá" },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                     style={{ background: "rgba(255,154,0,0.15)", color: "var(--copper)", border: "1px solid rgba(255,154,0,0.3)" }}>
                  {s.n}
                </div>
                <span className="text-sm" style={{ color: "#A1A1AA" }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-xl font-bold text-sm mb-6"
                style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
          + Cargar nuevo activo
        </button>

        {/* Formulario */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
               style={{ background: "rgba(0,0,0,0.85)" }}>
            <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
                 style={{ background: "#111111", border: "1px solid rgba(255,154,0,0.2)" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-white text-lg">Cargar activo</h2>
                <button onClick={() => setShowForm(false)} style={{ color: "#6B6358" }} className="text-xl">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {[
                  { field: "name",       label: "Nombre del activo",   type: "text",   placeholder: "Ej: Torre Catalinas Norte" },
                  { field: "location",   label: "Ubicación",           type: "text",   placeholder: "Ciudad, País" },
                  { field: "totalValue", label: "Valor total (USD)",   type: "number", placeholder: "Ej: 1000000" },
                  { field: "tokenPrice", label: "Precio por token (USD)", type: "number", placeholder: "Ej: 100" },
                ].map(f => (
                  <div key={f.field}>
                    <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>{f.label}</label>
                    <input type={f.type} required placeholder={f.placeholder}
                           value={form[f.field as keyof typeof form]}
                           onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                           className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                           style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                           onFocus={e => e.target.style.borderColor = "var(--copper)"}
                           onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
                  </div>
                ))}

                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Sector</label>
                  <select required value={form.sector}
                          onChange={e => setForm(prev => ({ ...prev, sector: e.target.value }))}
                          className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                          style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <option value="">Seleccioná un sector</option>
                    {SECTORS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Descripción del activo</label>
                  <textarea required rows={3} placeholder="Descripción detallada del activo, características, contratos vigentes..."
                            value={form.description}
                            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none resize-none"
                            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                            onFocus={e => e.target.style.borderColor = "var(--copper)"}
                            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                          className="flex-1 py-3 rounded-lg font-semibold text-sm"
                          style={{ background: "#161616", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.07)" }}>
                    Cancelar
                  </button>
                  <button type="submit"
                          className="flex-1 py-3 rounded-lg font-bold text-sm"
                          style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
                    Enviar activo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
