"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";

const KYC_STEPS = [
  { id: 1, label: "Datos personales",     icon: "👤" },
  { id: 2, label: "Documento de identidad", icon: "🪪" },
  { id: 3, label: "Verificación",          icon: "✅" },
];

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep]     = useState(1);
  const [saved, setSaved]   = useState(false);
  const [form, setForm]     = useState({ phone: "", country: "", docType: "DNI", docNumber: "" });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  async function handleKYC(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) { setStep(s => s + 1); return; }
    try {
      await updateDoc(doc(db, "users", user!.id), { kycStatus: "en_revision" });
      setSaved(true);
    } catch {
      alert("Error al enviar. Intentá de nuevo.");
    }
  }

  const KYC_STATUS_INFO = {
    pendiente:   { label: "Pendiente",   color: "#F59E0B", desc: "Completá tu verificación para invertir." },
    en_revision: { label: "En revisión", color: "#3B82F6", desc: "Tu documentación está siendo revisada. 24-48hs hábiles." },
    aprobado:    { label: "Aprobado",    color: "#10B981", desc: "Tu identidad fue verificada. Podés invertir sin límites." },
    rechazado:   { label: "Rechazado",   color: "#EF4444", desc: "Hubo un problema con tu verificación. Contactanos." },
  };
  const kycInfo = KYC_STATUS_INFO[user.kycStatus];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-2xl mx-auto">
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Mi Perfil</h1>
          <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>Datos de cuenta y verificación KYC</p>
        </div>

        {/* Info de usuario */}
        <div className="p-6 rounded-xl mb-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                 style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-white text-lg">{user.name}</div>
              <div className="text-sm" style={{ color: "#A1A1AA" }}>{user.email}</div>
              <div className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block font-semibold capitalize"
                   style={{ background: "rgba(255,154,0,0.12)", color: "var(--copper)", border: "1px solid rgba(255,154,0,0.25)" }}>
                {user.role}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg flex items-center gap-3"
               style={{ background: `${kycInfo.color}11`, border: `1px solid ${kycInfo.color}33` }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: kycInfo.color }} />
            <div>
              <span className="text-sm font-semibold" style={{ color: kycInfo.color }}>KYC {kycInfo.label}</span>
              <span className="text-sm ml-2" style={{ color: "#A1A1AA" }}>{kycInfo.desc}</span>
            </div>
          </div>
        </div>

        {/* KYC Form */}
        {user.kycStatus === "pendiente" && !saved && (
          <div className="p-6 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-bold text-white mb-5">Verificación de identidad</h2>

            {/* Steps */}
            <div className="flex items-center gap-2 mb-6">
              {KYC_STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                         style={{
                           background: step >= s.id ? "linear-gradient(135deg, #FF9A00, #D4AF37)" : "#161616",
                           color: step >= s.id ? "#000" : "#6B6358",
                           border: step >= s.id ? "none" : "1px solid rgba(255,255,255,0.07)",
                         }}>
                      {step > s.id ? "✓" : s.id}
                    </div>
                    <span className="text-xs text-center" style={{ color: step >= s.id ? "#A1A1AA" : "#6B6358", fontSize: "0.7rem" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < KYC_STEPS.length - 1 && (
                    <div className="flex-1 h-px mb-4" style={{ background: step > s.id ? "var(--copper)" : "rgba(255,255,255,0.07)" }} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleKYC} className="flex flex-col gap-4">
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Teléfono</label>
                    <input type="tel" required placeholder="+54 11 1234-5678"
                           value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                           className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                           style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                           onFocus={e => e.target.style.borderColor = "var(--copper)"}
                           onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>País de residencia</label>
                    <select required value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                            className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <option value="">Seleccioná tu país</option>
                      {["Argentina","Brasil","México","Colombia","Chile","Perú","Uruguay","Panamá","Costa Rica","Estados Unidos","España"].map(c =>
                        <option key={c} value={c}>{c}</option>
                      )}
                    </select>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Tipo de documento</label>
                    <select value={form.docType} onChange={e => setForm(p => ({ ...p, docType: e.target.value }))}
                            className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <option>DNI</option>
                      <option>Pasaporte</option>
                      <option>Cédula de identidad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5" style={{ color: "#A1A1AA" }}>Número de documento</label>
                    <input type="text" required placeholder="Ej: 35123456"
                           value={form.docNumber} onChange={e => setForm(p => ({ ...p, docNumber: e.target.value }))}
                           className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                           style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                           onFocus={e => e.target.style.borderColor = "var(--copper)"}
                           onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-sm mb-2" style={{ color: "#A1A1AA" }}>📎 Subí una foto de tu documento</p>
                    <input type="file" accept="image/*" className="text-sm" style={{ color: "#A1A1AA" }} />
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="font-semibold text-white mb-2">Todo listo para enviar</p>
                  <p className="text-sm" style={{ color: "#A1A1AA" }}>
                    Revisaremos tu documentación en 24-48hs hábiles y te notificaremos por email.
                  </p>
                </div>
              )}

              <button type="submit" className="w-full py-3 rounded-lg font-bold text-sm mt-2"
                      style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
                {step < 3 ? "Continuar →" : "Enviar verificación"}
              </button>
            </form>
          </div>
        )}

        {saved && (
          <div className="p-6 rounded-xl text-center" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div className="text-4xl mb-3">✅</div>
            <div className="font-bold text-white mb-2">Verificación enviada</div>
            <div className="text-sm" style={{ color: "#A1A1AA" }}>Te notificaremos a {user.email} en 24-48hs hábiles.</div>
          </div>
        )}
      </main>
    </div>
  );
}
