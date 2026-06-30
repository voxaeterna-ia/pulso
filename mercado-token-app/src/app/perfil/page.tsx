"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseDb, getFirebaseAuth } from "@/lib/firebase";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { UserRole } from "@/types";

const KYC_STEPS = [
  { id: 1, label: "Datos",      icon: "👤" },
  { id: 2, label: "Documento",  icon: "🪪" },
  { id: 3, label: "Selfie",     icon: "🤳" },
  { id: 4, label: "Confirmar",  icon: "✅" },
];

const KYC_STATUS_INFO = {
  pendiente:   { label: "Pendiente",   color: "#F59E0B", icon: "⏳", desc: "Completá tu verificación para invertir sin límites." },
  en_revision: { label: "En revisión", color: "#3B82F6", icon: "🔍", desc: "Tu documentación está siendo revisada. 24-48hs hábiles." },
  aprobado:    { label: "Aprobado",    color: "#10B981", icon: "✅", desc: "Tu identidad fue verificada. Podés invertir sin límites." },
  rechazado:   { label: "Rechazado",   color: "#EF4444", icon: "❌", desc: "Hubo un problema con tu verificación. Contactanos." },
};

type ValidateMode = "document" | "face" | "none";

function SmartUpload({
  label, value, onChange, hint, mode = "none", capture = "environment",
}: {
  label: string;
  value: string;
  onChange: (name: string, file: File | null) => void;
  hint?: string;
  mode?: ValidateMode;
  capture?: "environment" | "user";
}) {
  const [validating, setValidating] = useState(false);
  const [error, setError]           = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setValidating(true);
    onChange("", null);

    try {
      if (mode === "document") {
        const { validateDocument } = await import("@/lib/services/imageValidation");
        const result = await validateDocument(file);
        if (!result.valid) { setError(result.error ?? "Imagen inválida."); setValidating(false); return; }
      }
      if (mode === "face") {
        const { validateFace } = await import("@/lib/services/imageValidation");
        const result = await validateFace(file);
        if (!result.valid) { setError(result.error ?? "No se detectó un rostro válido."); setValidating(false); return; }
      }
      onChange(file.name, file);
    } catch {
      setError("Error al procesar la imagen. Intentá de nuevo.");
    } finally {
      setValidating(false);
    }
  }

  const state = validating ? "validating" : value ? "ok" : error ? "error" : "empty";
  const borderColor = state === "ok" ? "#FF9A00" : state === "error" ? "#EF4444" : "rgba(255,255,255,0.1)";

  return (
    <div>
      <label className="block text-sm mb-1.5 font-medium" style={{ color: "#A1A1AA" }}>{label}</label>
      {hint && <p className="text-xs mb-2" style={{ color: "#6B6358" }}>{hint}</p>}

      <label className="flex flex-col items-center justify-center gap-2 w-full py-5 rounded-lg cursor-pointer transition"
             style={{ background: "#161616", border: `2px dashed ${borderColor}`, opacity: validating ? 0.7 : 1 }}>
        <span className="text-2xl">
          {state === "validating" ? "⏳" : state === "ok" ? "✅" : state === "error" ? "❌" : "📷"}
        </span>
        <span className="text-sm font-medium text-center px-2" style={{ color: state === "ok" ? "#FF9A00" : state === "error" ? "#EF4444" : "#6B6358" }}>
          {state === "validating" ? "Validando imagen..." : state === "ok" ? value : state === "error" ? "Imagen rechazada" : "Tocá para sacar la foto"}
        </span>
        {state !== "validating" && (
          <span className="text-xs" style={{ color: "#4a4a4a" }}>
            {mode === "document" ? "JPG, PNG · DNI horizontal · Máx 20MB" :
             mode === "face"     ? "JPG, PNG · Rostro visible · Máx 20MB" :
             "JPG, PNG · Máx 20MB"}
          </span>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" capture={capture}
               className="hidden" onChange={handleFile} />
      </label>

      {error && (
        <div className="mt-2 p-3 rounded-lg text-xs flex items-start gap-2"
             style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
          <span className="flex-shrink-0">⚠️</span>
          <span>{error} <button className="underline ml-1" style={{ color: "#FF9A00" }}
                onClick={() => setError("")}>Intentar de nuevo</button></span>
        </div>
      )}
    </div>
  );
}

export default function PerfilPage() {
  const { user, loading, updateUser, setLocalUser } = useAuth();
  const router = useRouter();
  const [step, setStep]         = useState(1);
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [kycError, setKycError] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleChanged, setRoleChanged] = useState(false);
  const [form, setForm]         = useState({
    phone: "", country: "",
    nombres: "", apellidos: "", fechaNacimiento: "",
    docType: "DNI", docNumber: "",
    fileNameFront: "", fileNameBack: "", fileNameSelfie: ""
  });
  // Archivos reales (no persistidos en estado serializable) para envío a validación KYC
  const [files, setFiles] = useState<{ front: File | null; back: File | null; selfie: File | null }>({
    front: null, back: null, selfie: null,
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
  const TOTAL_STEPS = KYC_STEPS.length;

  async function handleRoleChange(newRole: UserRole) {
    if (!user || newRole === user.role || roleSaving) return;
    setRoleSaving(true);
    try {
      await updateUser({ role: newRole });
      setRoleChanged(true);
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    } catch (e) {
      console.error("Error cambiando rol:", e);
      alert("Error al cambiar el rol. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setRoleSaving(false);
    }
  }

  async function handleKYC(e: React.FormEvent) {
    e.preventDefault();
    if (step < TOTAL_STEPS) { setStep(s => s + 1); return; }
    if (!files.front || !files.back || !files.selfie) {
      setKycError("Faltan una o más imágenes. Volvé al paso de documento/selfie.");
      return;
    }
    setSaving(true);
    setKycError("");
    try {
      const { fileToDataUrl } = await import("@/lib/services/imageValidation");
      const [frenteDniBase64, dorsoDniBase64, selfieBase64] = await Promise.all([
        fileToDataUrl(files.front),
        fileToDataUrl(files.back),
        fileToDataUrl(files.selfie),
      ]);

      const idToken = await getFirebaseAuth().currentUser?.getIdToken().catch(() => null);
      if (!idToken) {
        setKycError("Tu sesión expiró. Volvé a iniciar sesión e intentá de nuevo.");
        return;
      }

      const res = await fetch("/api/kyc/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          nombres: form.nombres,
          apellidos: form.apellidos,
          fechaNacimiento: form.fechaNacimiento,
          numeroDocumento: form.docNumber,
          frenteDniBase64,
          dorsoDniBase64,
          selfieBase64,
        }),
      });

      const result = await res.json();

      // Las imágenes y su data URL solo viven en memoria del navegador durante
      // el envío; nunca se escriben en Firestore ni en Storage. Las soltamos
      // apenas tenemos la respuesta para minimizar su tiempo de vida.
      setFiles({ front: null, back: null, selfie: null });

      if (!res.ok) {
        setKycError(result.error ?? "No se pudo completar la validación. Intentá de nuevo.");
        return;
      }

      if (!result.aprobado) {
        setKycError(
          "No pudimos verificar tu identidad automáticamente" +
            (result.motivo ? `: ${result.motivo}.` : ".") +
            " Tu solicitud quedará en revisión manual."
        );
      }

      // El endpoint ya persistió kycStatus/kycValidatedAt en Firestore vía
      // Admin SDK (el cliente no tiene permiso para escribir esos campos,
      // ver firestore.rules). Acá solo reflejamos el resultado en la UI.
      setLocalUser({ kycStatus: result.kycStatus, kycValidatedAt: result.validatedAt });
      setSaved(true);
    } catch {
      setKycError("Error al enviar. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-16 max-w-2xl mx-auto">

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

        {/* Selector de rol */}
        <div className="p-6 rounded-xl mb-6" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="font-bold text-white mb-1">Tipo de cuenta</h2>
          <p className="text-sm mb-5" style={{ color: "#6B6358" }}>
            Podés cambiar tu rol en cualquier momento. El cambio aplica de inmediato.
          </p>

          {roleChanged && (
            <div className="mb-4 p-3 rounded-lg text-sm text-center"
                 style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}>
              ✅ Rol actualizado. Redirigiendo al panel...
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {([
              {
                role: "inversor" as UserRole,
                icon: "🌍",
                title: "Inversor",
                desc: "Explorá activos tokenizados y construí tu portafolio de inversión.",
              },
              {
                role: "emisor" as UserRole,
                icon: "🏢",
                title: "Emisor de activos",
                desc: "Cargá tus activos reales para tokenizarlos en la plataforma y acceder a inversores.",
              },
              {
                role: "invitado" as UserRole,
                icon: "👀",
                title: "Invitado",
                desc: "Explorá la plataforma sin compromisos. Limitado a ver el marketplace.",
              },
            ] as { role: UserRole; icon: string; title: string; desc: string }[]).map(opt => {
              const isActive = user.role === opt.role;
              return (
                <button key={opt.role} onClick={() => handleRoleChange(opt.role)} disabled={roleSaving || roleChanged}
                        className="p-4 rounded-xl text-left transition w-full"
                        style={{
                          background: isActive ? "rgba(255,154,0,0.08)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isActive ? "rgba(255,154,0,0.35)" : "rgba(255,255,255,0.07)"}`,
                          cursor: isActive ? "default" : "pointer",
                          opacity: roleSaving ? 0.6 : 1,
                        }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: isActive ? "#FF9A00" : "#fff" }}>
                          {opt.title}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "#6B6358" }}>{opt.desc}</div>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ml-3"
                            style={{ background: "rgba(255,154,0,0.15)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.3)" }}>
                        Actual
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enviado */}
        {saved && (
          <div className="p-8 rounded-xl text-center" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div className="text-5xl mb-4">✅</div>
            <div className="font-bold text-white text-lg mb-2">Verificación enviada</div>
            <div className="text-sm mb-4" style={{ color: "#A1A1AA" }}>
              Revisaremos tu documentación en 24-48hs hábiles.
            </div>
            <div className="p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <p className="text-sm" style={{ color: "#93C5FD" }}>
                📧 Te enviaremos el resultado a <strong>{user.email}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Ya verificado o en revisión */}
        {!saved && user.kycStatus !== "pendiente" && (
          <div className="p-8 rounded-xl text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-5xl mb-4">{kycInfo.icon}</div>
            <div className="font-bold text-white text-lg mb-2">KYC {kycInfo.label}</div>
            <div className="text-sm" style={{ color: "#A1A1AA" }}>{kycInfo.desc}</div>
          </div>
        )}

        {/* KYC Form */}
        {!saved && user.kycStatus === "pendiente" && (
          <div className="p-6 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-bold text-white mb-1">Verificación de identidad</h2>
            <p className="text-sm mb-6" style={{ color: "#6B6358" }}>🔒 Proceso seguro · {TOTAL_STEPS} pasos · ~3 minutos</p>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-2" style={{ color: "#6B6358" }}>
                <span>Paso {step} de {TOTAL_STEPS}</span>
                <span>{Math.round((step / TOTAL_STEPS) * 100)}% completado</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: "#222" }}>
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: "linear-gradient(90deg, #FF9A00, #D4AF37)" }} />
              </div>
            </div>

            {/* Steps indicator */}
            <div className="flex items-start mb-8 mt-5">
              {KYC_STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                         style={{
                           background: step > s.id ? "#10B981" : step === s.id ? "linear-gradient(135deg, #FF9A00, #D4AF37)" : "#1a1a1a",
                           color: step >= s.id ? "#000" : "#555",
                           border: step < s.id ? "1px solid rgba(255,255,255,0.08)" : "none",
                           fontSize: step > s.id ? "0.7rem" : "0.75rem",
                         }}>
                      {step > s.id ? "✓" : s.icon}
                    </div>
                    <span className="mt-1 text-center" style={{ color: step >= s.id ? "#A1A1AA" : "#444", fontSize: "0.6rem" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < KYC_STEPS.length - 1 && (
                    <div className="flex-1 h-px mx-1 mb-4 transition-all"
                         style={{ background: step > s.id ? "#10B981" : "rgba(255,255,255,0.06)" }} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleKYC} className="flex flex-col gap-4">

              {/* Paso 1 - Datos personales */}
              {step === 1 && (
                <>
                  <div className="p-4 rounded-lg" style={{ background: "rgba(255,154,0,0.06)", border: "1px solid rgba(255,154,0,0.15)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--copper)" }}>👤 Datos personales</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6358" }}>Ingresá tu teléfono y país de residencia</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1.5 font-medium" style={{ color: "#A1A1AA" }}>Nombres</label>
                      <input type="text" required placeholder="Como figuran en tu documento"
                             value={form.nombres} onChange={e => setForm(p => ({ ...p, nombres: e.target.value }))}
                             className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                             style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                             onFocus={e => e.target.style.borderColor = "var(--copper)"}
                             onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
                    </div>
                    <div>
                      <label className="block text-sm mb-1.5 font-medium" style={{ color: "#A1A1AA" }}>Apellidos</label>
                      <input type="text" required placeholder="Como figuran en tu documento"
                             value={form.apellidos} onChange={e => setForm(p => ({ ...p, apellidos: e.target.value }))}
                             className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                             style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                             onFocus={e => e.target.style.borderColor = "var(--copper)"}
                             onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1.5 font-medium" style={{ color: "#A1A1AA" }}>Fecha de nacimiento</label>
                    <input type="date" required
                           value={form.fechaNacimiento} onChange={e => setForm(p => ({ ...p, fechaNacimiento: e.target.value }))}
                           className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                           style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}
                           onFocus={e => e.target.style.borderColor = "var(--copper)"}
                           onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"} />
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

              {/* Paso 2 - Documento */}
              {step === 2 && (
                <>
                  <div className="p-4 rounded-lg" style={{ background: "rgba(255,154,0,0.06)", border: "1px solid rgba(255,154,0,0.15)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--copper)" }}>🪪 Documento de identidad</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6358" }}>Fotografiá ambas caras de tu documento</p>
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
                  <SmartUpload label="Frente del documento" value={form.fileNameFront} mode="document"
                              hint="Fotografiá el frente del DNI en posición horizontal. El texto debe ser legible."
                              onChange={(v, f) => { setForm(p => ({ ...p, fileNameFront: v })); setFiles(p => ({ ...p, front: f })); }} />
                  <SmartUpload label="Reverso del documento" value={form.fileNameBack} mode="document"
                              hint="Fotografiá el reverso del DNI en posición horizontal."
                              onChange={(v, f) => { setForm(p => ({ ...p, fileNameBack: v })); setFiles(p => ({ ...p, back: f })); }} />
                </>
              )}

              {/* Paso 3 - Selfie */}
              {step === 3 && (
                <>
                  <div className="p-4 rounded-lg" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <p className="text-sm font-semibold" style={{ color: "#A78BFA" }}>🤳 Selfie con documento</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6358" }}>Para confirmar que sos vos quien presenta el documento</p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-sm font-semibold text-white mb-3">Instrucciones:</p>
                    <ul className="space-y-2">
                      {[
                        "Sostené tu DNI/pasaporte junto a tu cara",
                        "Asegurate que tu cara y el documento sean visibles",
                        "Buscá buena iluminación, evitá contraluz",
                        "No uses anteojos de sol ni sombrero",
                      ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#A1A1AA" }}>
                          <span style={{ color: "var(--copper)", flexShrink: 0 }}>→</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <SmartUpload
                    label="Selfie sosteniendo el documento"
                    value={form.fileNameSelfie}
                    mode="face"
                    capture="user"
                    hint="Usá la cámara frontal. Tu cara y el DNI deben ser visibles. No uses anteojos ni máscara."
                    onChange={(v, f) => { setForm(p => ({ ...p, fileNameSelfie: v })); setFiles(p => ({ ...p, selfie: f })); }}
                  />
                  {!form.fileNameSelfie && (
                    <p className="text-xs text-center" style={{ color: "#EF4444" }}>
                      * La selfie con documento es obligatoria para completar la verificación
                    </p>
                  )}
                </>
              )}

              {/* Paso 4 - Confirmación */}
              {step === 4 && (
                <>
                  <div className="p-4 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <p className="text-sm font-semibold" style={{ color: "#10B981" }}>✅ Revisá antes de enviar</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6358" }}>Verificá que todos los datos sean correctos</p>
                  </div>
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                    {[
                      { label: "Nombres",       value: form.nombres },
                      { label: "Apellidos",     value: form.apellidos },
                      { label: "Fecha nacimiento", value: form.fechaNacimiento },
                      { label: "Email",         value: user.email },
                      { label: "Teléfono",      value: form.phone },
                      { label: "País",          value: form.country },
                      { label: "Documento",     value: `${form.docType} · ${form.docNumber}` },
                      { label: "Doc. Frente",   value: form.fileNameFront  ? "✅ Adjuntado" : "❌ Faltante" },
                      { label: "Doc. Reverso",  value: form.fileNameBack   ? "✅ Adjuntado" : "❌ Faltante" },
                      { label: "Selfie",        value: form.fileNameSelfie ? "✅ Adjuntado" : "❌ Faltante" },
                    ].map((row, i) => (
                      <div key={row.label} className="flex justify-between px-4 py-3"
                           style={{ background: i % 2 === 0 ? "#111" : "#161616" }}>
                        <span className="text-sm" style={{ color: "#6B6358" }}>{row.label}</span>
                        <span className="text-sm font-medium" style={{
                          color: row.value.includes("❌") ? "#EF4444" : row.value.includes("✅") ? "#10B981" : "#fff"
                        }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <p className="text-xs" style={{ color: "#93C5FD" }}>
                      📧 Recibirás el resultado a <strong>{user.email}</strong> en 24-48hs hábiles. Tus datos están cifrados y protegidos.
                    </p>
                  </div>
                </>
              )}

              {kycError && (
                <div className="p-3 rounded-lg text-xs flex items-start gap-2"
                     style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{kycError}</span>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                          className="flex-1 py-3 rounded-lg font-semibold text-sm"
                          style={{ background: "#161616", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.07)" }}>
                    ← Volver
                  </button>
                )}
                <button type="submit" disabled={saving || (step === 3 && !form.fileNameSelfie)}
                        className="flex-1 py-3 rounded-lg font-bold text-sm transition"
                        style={{
                          background: (saving || (step === 3 && !form.fileNameSelfie)) ? "#333" : "linear-gradient(135deg, #FF9A00, #D4AF37)",
                          color: (saving || (step === 3 && !form.fileNameSelfie)) ? "#666" : "#000"
                        }}>
                  {saving ? "Enviando..." : step < TOTAL_STEPS ? "Continuar →" : "Enviar verificación"}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
