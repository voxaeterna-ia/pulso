"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb } from "@/lib/firebase";
import Navbar from "@/components/layout/Navbar";

const KYC_STEPS = [
  { id: 1, label: "Datos personales",      icon: "👤", desc: "Teléfono y país de residencia" },
  { id: 2, label: "Documento de identidad", icon: "🪪", desc: "DNI, pasaporte o cédula" },
  { id: 3, label: "Confirmación",           icon: "✅", desc: "Revisá y enviá tu solicitud" },
];

const KYC_STATUS_INFO = {
  pendiente:   { label: "Pendiente",   color: "#F59E0B", icon: "⏳", desc: "Completá tu verificación para invertir sin límites." },
  en_revision: { label: "En revisión", color: "#3B82F6", icon: "🔍", desc: "Tu documentación está siendo revisada. 24-48hs hábiles." },
  aprobado:    { label: "Aprobado",    color: "#10B981", icon: "✅", desc: "Tu identidad fue verificada. Podés invertir sin límites." },
  rechazado:   { label: "Rechazado",   color: "#EF4444", icon: "❌", desc: "Hubo un problema con tu verificación. Contactanos." },
};

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep]   = useState(1);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]   = useState({
    phone: "", country: "", docType: "DNI", docNumber: "", fileName: ""
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
           style={{ borderColor: "var(--copper)", borderTopColor: "transparent" }} />
    </div>
  );

  const kycInfo = KYC_STATUS_INFO[user.kycStatus];

  async function handleKYC(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) { setStep(s => s + 1); return; }
    setSaving(true);
    try {
      await updateDoc(doc(getFirebaseDb(), "users", user!.id), { kycStatus: "en_revision" });
      setSaved(true);
    } catch {
      alert("Error al enviar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-16 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Mi Perfil</h1>
          <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>Datos de cuenta y verificación KYC</p>
        </div>

        {/* Info usuario */}
        <div className="p-6 rounded-xl mb-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                 style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-lg truncate">{user.name}</div>
              <div className="text-sm truncate" style={{ color: "#A1A1AA" }}>{user.email}</div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                      style={{ background: "rgba(255,154,0,0.12)", color: "var(--copper)", border: "1px solid rgba(255,154,0,0.25)" }}>
                  {user.role}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${kycInfo.color}18`, color: kycInfo.color, border: `1px solid ${kycInfo.color}33` }}>
                  {kycInfo.icon} KYC {kycInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{ background: "#161616" }}>
              <div className="text-xs mb-1" style={{ color: "#6B6358" }}>BALANCE MKT</div>
              <div className="font-bold" style={{ color: "var(--gold-light)" }}>{user.mktBalance.toLocaleString()} MKT</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: "#161616" }}>
              <div className="text-xs mb-1" style={{ color: "#6B6358" }}>ESTADO KYC</div>
              <div className="font-bold" style={{ color: kycInfo.color }}>{kycInfo.label}</div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg" style={{ background: `${kycInfo.color}0d`, border: `1px solid ${kycInfo.color}33` }}>
            <p className="text-sm" style={{ color: "#A1A1AA" }}>{kycInfo.desc}</p>
          </div>
        </div>

        {/* KYC enviado */}
        {saved && (
          <div className="p-8 rounded-xl text-center" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div className="text-5xl mb-4">✅</div>
            <div className="font-bold text-white text-lg mb-2">Verificación enviada</div>
            <div className="text-sm" style={{ color: "#A1A1AA" }}>
              Te notificaremos a <strong className="text-white">{user.email}</strong> en 24-48hs hábiles.
            </div>
          </div>
        )}

        {/* KYC ya en revisión o aprobado */}
        {!saved && user.kycStatus !== "pendiente" && (
          <div className="p-6 rounded-xl text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-5xl mb-4">{kycInfo.icon}</div>
            <div className="font-bold text-white text-lg mb-2">KYC {kycInfo.label}</div>
            <div className="text-sm" style={{ color: "#A1A1AA" }}>{kycInfo.desc}</div>
          </div>
        )}

        {/* KYC Form */}
        {!saved && user.kycStatus === "pendiente" && (
          <div className="p-6 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-bold text-white mb-1">Verificación de identidad</h2>
            <p className="text-sm mb-6" style={{ color: "#6B6358" }}>Proceso seguro · Solo toma 2 minutos</p>

            {/* Steps */}
            <div className="flex items-start gap-0 mb-8">
              {KYC_STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                         style={{
                           background: step > s.id ? "#10B981" : step === s.id ? "linear-gradient(135deg, #FF9A00, #D4AF37)" : "#1a1a1a",
                           color: step >= s.id ? "#000" : "#6B6358",
                           border: step >= s.id ? "none" : "1px solid rgba(255,255,255,0.1)",
                         }}>
                      {step > s.id ? "✓" : s.id}
                    </div>
                    <div className="mt-1.5 text-center" style={{ width: 72 }}>
                      <div className="text-xs font-medium" style={{ color: step >= s.id ? "#fff" : "#6B6358", fontSize: "0.65rem" }}>{s.label}</div>
                    </div>
                  </div>
                  {i < KYC_STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1 mb-5 transition-all"
                         style={{ background: step > s.id ? "#10B981" : "rgba(255,255,255,0.07)" }} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleKYC} className="flex flex-col gap-4">

              {/* Step 1 */}
              {step === 1 && (
                <>
                  <div className="p-4 rounded-lg mb-2" style={{ background: "rgba(255,154,0,0.06)", border: "1px solid rgba(255,154,0,0.15)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--copper)" }}>👤 Datos personales</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6358" }}>Ingresá tu teléfono y país de residencia</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium" style={{ color: "#A1A1AA" }}>Teléfono</label>
                    <input type="tel" required placeholder="+54 11 1234-5678"
                           value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                           className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                           style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                           onFocus={e => e.target.style.borderColor = "var(--copper)"}
                           onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium" style={{ color: "#A1A1AA" }}>País de residencia</label>
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

              {/* Step 2 */}
              {step === 2 && (
                <>
                  <div className="p-4 rounded-lg mb-2" style={{ background: "rgba(255,154,0,0.06)", border: "1px solid rgba(255,154,0,0.15)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--copper)" }}>🪪 Documento de identidad</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6358" }}>Ingresá los datos de tu documento oficial</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium" style={{ color: "#A1A1AA" }}>Tipo de documento</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["DNI", "Pasaporte", "Cédula"].map(t => (
                        <button key={t} type="button" onClick={() => setForm(p => ({ ...p, docType: t }))}
                                className="py-2.5 rounded-lg text-sm font-semibold transition"
                                style={{
                                  background: form.docType === t ? "linear-gradient(135deg, #FF9A00, #D4AF37)" : "#161616",
                                  color: form.docType === t ? "#000" : "#A1A1AA",
                                  border: form.docType === t ? "none" : "1px solid rgba(255,255,255,0.07)",
                                }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium" style={{ color: "#A1A1AA" }}>Número de documento</label>
                    <input type="text" required placeholder="Ej: 35123456"
                           value={form.docNumber} onChange={e => setForm(p => ({ ...p, docNumber: e.target.value }))}
                           className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                           style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                           onFocus={e => e.target.style.borderColor = "var(--copper)"}
                           onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium" style={{ color: "#A1A1AA" }}>Foto del documento</label>
                    <label className="flex flex-col items-center justify-center gap-2 w-full py-6 rounded-lg cursor-pointer transition"
                           style={{ background: "#161616", border: "2px dashed rgba(255,255,255,0.1)" }}
                           onMouseOver={e => (e.currentTarget.style.borderColor = "var(--copper)")}
                           onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
                      <span className="text-2xl">{form.fileName ? "📎" : "📷"}</span>
                      <span className="text-sm" style={{ color: form.fileName ? "var(--copper)" : "#6B6358" }}>
                        {form.fileName || "Hacé clic para subir una imagen"}
                      </span>
                      <input type="file" accept="image/*" className="hidden"
                             onChange={e => setForm(p => ({ ...p, fileName: e.target.files?.[0]?.name || "" }))} />
                    </label>
                  </div>
                </>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <>
                  <div className="p-4 rounded-lg mb-2" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <p className="text-sm font-semibold" style={{ color: "#10B981" }}>✅ Todo listo para enviar</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6358" }}>Revisá los datos antes de confirmar</p>
                  </div>
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                    {[
                      { label: "Nombre", value: user.name },
                      { label: "Email", value: user.email },
                      { label: "Teléfono", value: form.phone },
                      { label: "País", value: form.country },
                      { label: "Documento", value: `${form.docType} · ${form.docNumber}` },
                      { label: "Archivo", value: form.fileName || "No adjuntado" },
                    ].map((row, i) => (
                      <div key={row.label} className="flex justify-between px-4 py-3"
                           style={{ background: i % 2 === 0 ? "#111" : "#161616" }}>
                        <span className="text-sm" style={{ color: "#6B6358" }}>{row.label}</span>
                        <span className="text-sm font-medium text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <p className="text-xs" style={{ color: "#A1A1AA" }}>
                      🔒 Tus datos están protegidos. El proceso de revisión toma 24-48hs hábiles y recibirás una notificación por email.
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-2">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                          className="flex-1 py-3 rounded-lg font-semibold text-sm"
                          style={{ background: "#161616", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.07)" }}>
                    ← Volver
                  </button>
                )}
                <button type="submit" disabled={saving}
                        className="flex-1 py-3 rounded-lg font-bold text-sm transition"
                        style={{ background: saving ? "#555" : "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
                  {saving ? "Enviando..." : step < 3 ? "Continuar →" : "Enviar verificación"}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
