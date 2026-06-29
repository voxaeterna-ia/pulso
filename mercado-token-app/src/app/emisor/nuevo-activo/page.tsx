"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ASSET_TYPES, COMMON_DOCUMENTS, PAISES, MONEDAS, ESTADO_PROYECTO_OPTIONS, type FieldDef, type AssetTypeConfig } from "@/config/assetTypes";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const INPUT_STYLE: React.CSSProperties = { background: "#161616", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "10px 14px", width: "100%", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };
const LABEL_STYLE: React.CSSProperties = { color: "#A1A1AA", fontSize: "0.82rem", marginBottom: 6, display: "block", fontWeight: 500 };
const CARD: React.CSSProperties = { background: "#111111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px" };
const BTN_PRIMARY: React.CSSProperties = { background: "linear-gradient(135deg,#FF9A00,#D4AF37)", color: "#000", fontWeight: 700, borderRadius: 10, padding: "12px 28px", fontSize: "0.9rem", cursor: "pointer", border: "none" };
const BTN_SECONDARY: React.CSSProperties = { background: "#161616", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600, borderRadius: 10, padding: "12px 28px", fontSize: "0.9rem", cursor: "pointer" };

const STEPS = [
  { n: 1, label: "Básicos" },
  { n: 2, label: "Específico" },
  { n: 3, label: "Tokenización" },
  { n: 4, label: "Documentos" },
  { n: 5, label: "Multimedia" },
  { n: 6, label: "Envío" },
];

function DynamicField({ field, value, onChange, error }: { field: FieldDef; value: string; onChange: (v: string) => void; error?: string }) {
  const [focused, setFocused] = useState(false);
  const border = error ? "1px solid #EF4444" : focused ? "1px solid #FF9A00" : "1px solid rgba(255,255,255,0.1)";
  const style = { ...INPUT_STYLE, border };
  const handlers = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style,
  };
  return (
    <div>
      <label style={LABEL_STYLE}>
        {field.label}
        {field.required && <span style={{ color: "#FF9A00", marginLeft: 4 }}>*</span>}
        {field.unit && <span style={{ color: "#6B7280", marginLeft: 6, fontSize: "0.76rem" }}>({field.unit})</span>}
      </label>
      {field.hint && <p style={{ color: "#6B7280", fontSize: "0.76rem", marginBottom: 6 }}>{field.hint}</p>}
      {field.type === "textarea" ? (
        <textarea {...handlers} rows={3} style={{ ...style, resize: "vertical", fontFamily: "inherit" }} />
      ) : field.type === "select" ? (
        <select {...handlers} style={{ ...style, appearance: "none" }}>
          <option value="">Seleccioná una opción</option>
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === "currency" ? (
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#A1A1AA", pointerEvents: "none" }}>$</span>
          <input {...handlers} type="number" min={0} style={{ ...style, paddingLeft: 26 }} />
        </div>
      ) : field.type === "percent" ? (
        <div style={{ position: "relative" }}>
          <input {...handlers} type="number" min={0} max={100} />
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#A1A1AA", pointerEvents: "none" }}>%</span>
        </div>
      ) : field.type === "number" ? (
        <input {...handlers} type="number" min={0} />
      ) : field.type === "date" ? (
        <input {...handlers} type="date" />
      ) : field.type === "url" ? (
        <input {...handlers} type="url" placeholder="https://" />
      ) : (
        <input {...handlers} type="text" />
      )}
      {error && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function DocUploader({ label, required, accept, hint, multiple, value, onChange }: {
  label: string; required: boolean; accept: string; hint?: string; multiple?: boolean; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ padding: "14px 16px", background: "#0D0D0D", borderRadius: 10, border: `1px dashed ${value ? "#FF9A00" : required ? "rgba(255,154,0,0.3)" : "rgba(255,255,255,0.1)"}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500 }}>{label}</span>
            {required
              ? <span style={{ background: "rgba(255,154,0,0.15)", color: "#FF9A00", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Requerido</span>
              : <span style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 20 }}>Opcional</span>}
            {multiple && <span style={{ color: "#6B7280", fontSize: "0.72rem" }}>(múltiple)</span>}
          </div>
          {hint && <p style={{ color: "#6B7280", fontSize: "0.76rem", marginTop: 4 }}>{hint}</p>}
          {value && <p style={{ color: "#10B981", fontSize: "0.78rem", marginTop: 6 }}>✓ {value}</p>}
        </div>
        <label style={{ flexShrink: 0, cursor: "pointer" }}>
          <span style={{ background: value ? "rgba(16,185,129,0.1)" : "rgba(255,154,0,0.1)", color: value ? "#10B981" : "#FF9A00", border: `1px solid ${value ? "#10B981" : "#FF9A00"}`, borderRadius: 8, padding: "8px 14px", fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap", display: "inline-block" }}>
            {value ? "Cambiar" : "Seleccionar"}
          </span>
          <input type="file" accept={accept} multiple={multiple} style={{ display: "none" }}
            onChange={e => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              onChange(files.length > 1 ? `${files.length} archivos` : files[0].name);
            }} />
        </label>
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ background: "#111", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 20px", position: "sticky", top: 64, zIndex: 10 }}>
      <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 4, alignItems: "center" }}>
        {STEPS.map((s, i) => (
          <div key={s.n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, margin: "0 auto",
                background: step > s.n ? "#FF9A00" : "transparent",
                border: step > s.n ? "none" : step === s.n ? "2px solid #FF9A00" : "2px solid rgba(255,255,255,0.15)",
                color: step > s.n ? "#000" : step === s.n ? "#FF9A00" : "#555",
              }}>
                {step > s.n ? "✓" : s.n}
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: step > s.n ? "#FF9A00" : "rgba(255,255,255,0.08)", marginLeft: 4 }} />}
            </div>
            <span style={{ fontSize: "0.62rem", color: step === s.n ? "#FF9A00" : step > s.n ? "#A1A1AA" : "#444", fontWeight: step === s.n ? 700 : 400, whiteSpace: "nowrap" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface WizardData {
  assetTypeId: string;
  nombre_del_activo: string; subtitulo: string; descripcion_corta: string; descripcion_completa: string;
  objetivo_de_la_tokenizacion: string; pais: string; provincia_estado: string; ciudad: string;
  direccion_referencial: string; empresa_emisora: string; responsable_del_proyecto: string;
  email_contacto: string; telefono_contacto: string; sitio_web: string; estado_actual_del_proyecto: string;
  specificFields: Record<string, string>;
  valor_total_estimado: string; monto_a_tokenizar: string; porcentaje_del_activo_a_tokenizar: string;
  cantidad_estimada_de_tokens: string; precio_estimado_por_token: string; moneda: string;
  rentabilidad_estimada: string; horizonte_del_proyecto: string; riesgos_principales: string; uso_de_fondos: string;
  documents: Record<string, string>;
  imagen_principal: string; galeria_de_imagenes: string; video_presentacion: string; presentacion_pdf: string;
  acepta_declaracion: boolean; acepta_autorizacion: boolean;
}

const EMPTY: WizardData = {
  assetTypeId: "", nombre_del_activo: "", subtitulo: "", descripcion_corta: "", descripcion_completa: "",
  objetivo_de_la_tokenizacion: "", pais: "", provincia_estado: "", ciudad: "",
  direccion_referencial: "", empresa_emisora: "", responsable_del_proyecto: "",
  email_contacto: "", telefono_contacto: "", sitio_web: "", estado_actual_del_proyecto: "",
  specificFields: {},
  valor_total_estimado: "", monto_a_tokenizar: "", porcentaje_del_activo_a_tokenizar: "",
  cantidad_estimada_de_tokens: "", precio_estimado_por_token: "", moneda: "USD",
  rentabilidad_estimada: "", horizonte_del_proyecto: "", riesgos_principales: "", uso_de_fondos: "",
  documents: {},
  imagen_principal: "", galeria_de_imagenes: "", video_presentacion: "", presentacion_pdf: "",
  acepta_declaracion: false, acepta_autorizacion: false,
};

export default function NuevoActivoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const assetConfig = ASSET_TYPES.find(t => t.id === data.assetTypeId);

  const set = useCallback((field: string, value: string | boolean) => {
    setData(d => ({ ...d, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }, []);

  const setSpecific = useCallback((key: string, value: string) => {
    setData(d => ({ ...d, specificFields: { ...d.specificFields, [key]: value } }));
    setErrors(e => { const n = { ...e }; delete n[`sp_${key}`]; return n; });
  }, []);

  const setDoc = useCallback((key: string, value: string) => {
    setData(d => ({ ...d, documents: { ...d.documents, [key]: value } }));
  }, []);

  function validateStep(): boolean {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!data.assetTypeId) errs.assetTypeId = "Seleccioná un tipo de activo";
      if (!data.nombre_del_activo.trim()) errs.nombre_del_activo = "Campo requerido";
      if (!data.descripcion_corta.trim()) errs.descripcion_corta = "Campo requerido";
      if (!data.descripcion_completa.trim()) errs.descripcion_completa = "Campo requerido";
      if (!data.objetivo_de_la_tokenizacion.trim()) errs.objetivo_de_la_tokenizacion = "Campo requerido";
      if (!data.empresa_emisora.trim()) errs.empresa_emisora = "Campo requerido";
      if (!data.responsable_del_proyecto.trim()) errs.responsable_del_proyecto = "Campo requerido";
      if (!data.email_contacto.trim()) errs.email_contacto = "Campo requerido";
    }
    if (step === 2 && assetConfig) {
      assetConfig.fields.filter(f => f.required).forEach(f => {
        if (!data.specificFields[f.key]?.trim()) errs[`sp_${f.key}`] = "Campo requerido";
      });
    }
    if (step === 3) {
      if (!data.valor_total_estimado) errs.valor_total_estimado = "Campo requerido";
      if (!data.monto_a_tokenizar) errs.monto_a_tokenizar = "Campo requerido";
      if (!data.cantidad_estimada_de_tokens) errs.cantidad_estimada_de_tokens = "Campo requerido";
      if (!data.rentabilidad_estimada.trim()) errs.rentabilidad_estimada = "Campo requerido";
      if (!data.horizonte_del_proyecto.trim()) errs.horizonte_del_proyecto = "Campo requerido";
      if (!data.riesgos_principales.trim()) errs.riesgos_principales = "Campo requerido";
      if (!data.uso_de_fondos.trim()) errs.uso_de_fondos = "Campo requerido";
    }
    if (step === 5 && !data.imagen_principal) errs.imagen_principal = "La imagen principal es requerida";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() { if (validateStep()) setStep(s => Math.min(s + 1, 6)); }
  function prev() { setStep(s => Math.max(s - 1, 1)); }

  async function saveAsset(status: "borrador" | "enviado_a_revision") {
    if (!user) return;
    setSaving(true);
    try {
      await addDoc(collection(getFirebaseDb(), "assets"), {
        emisorId: user.id, emisorEmail: user.email, status, type: data.assetTypeId,
        basicInfo: {
          nombre_del_activo: data.nombre_del_activo, subtitulo: data.subtitulo,
          descripcion_corta: data.descripcion_corta, descripcion_completa: data.descripcion_completa,
          objetivo_de_la_tokenizacion: data.objetivo_de_la_tokenizacion, pais: data.pais,
          provincia_estado: data.provincia_estado, ciudad: data.ciudad,
          direccion_referencial: data.direccion_referencial, empresa_emisora: data.empresa_emisora,
          responsable_del_proyecto: data.responsable_del_proyecto, email_contacto: data.email_contacto,
          telefono_contacto: data.telefono_contacto, sitio_web: data.sitio_web,
          estado_actual_del_proyecto: data.estado_actual_del_proyecto,
        },
        specificFields: data.specificFields,
        tokenization: {
          valor_total_estimado: data.valor_total_estimado, monto_a_tokenizar: data.monto_a_tokenizar,
          porcentaje_del_activo_a_tokenizar: data.porcentaje_del_activo_a_tokenizar,
          cantidad_estimada_de_tokens: data.cantidad_estimada_de_tokens,
          precio_estimado_por_token: data.precio_estimado_por_token, moneda: data.moneda,
          rentabilidad_estimada: data.rentabilidad_estimada, horizonte_del_proyecto: data.horizonte_del_proyecto,
          riesgos_principales: data.riesgos_principales, uso_de_fondos: data.uso_de_fondos,
        },
        documents: data.documents,
        multimedia: { imagen_principal: data.imagen_principal, galeria: data.galeria_de_imagenes, video: data.video_presentacion, pdf: data.presentacion_pdf },
        validacion: {
          identidad_emisor_validada: false, titularidad_validada: false, documentacion_completa: false,
          riesgo_preliminar: "", observaciones_admin: "", observaciones_validador: "",
          score_de_validacion: 0, aprobado_por: "", fecha_de_aprobacion: null, motivo_de_rechazo: "",
        },
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => router.push("/emisor/activos"), 2000);
    } catch (e) {
      console.error(e);
      alert("Error al guardar. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (!user || user.role !== "emisor") {
    return (
      <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...CARD, textAlign: "center", maxWidth: 400 }}>
          <p style={{ color: "#EF4444", fontWeight: 700, marginBottom: 8 }}>Acceso restringido</p>
          <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>Solo los emisores pueden cargar activos. Cambiá tu rol en Perfil.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh" }}>
      <Navbar />
      <ProgressBar step={step} />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 80px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem" }}>Cargar nuevo activo</h1>
          <p style={{ color: "#A1A1AA", fontSize: "0.85rem", marginTop: 4 }}>
            Paso {step} de {STEPS.length} — <span style={{ color: "#FF9A00" }}>{STEPS[step - 1].label}</span>
          </p>
        </div>

        {saved ? (
          <div style={{ ...CARD, textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>✅</div>
            <h2 style={{ color: "#10B981", fontWeight: 800, fontSize: "1.3rem", marginBottom: 8 }}>
              {data.acepta_declaracion ? "¡Activo enviado a revisión!" : "Borrador guardado"}
            </h2>
            <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>Redirigiendo a tus activos...</p>
          </div>
        ) : (
          <>
            {step === 1 && <Step1 data={data} set={set} errors={errors} />}
            {step === 2 && <Step2 data={data} config={assetConfig} errors={errors} setSpecific={setSpecific} />}
            {step === 3 && <Step3 data={data} set={set} errors={errors} />}
            {step === 4 && <Step4 data={data} config={assetConfig} setDoc={setDoc} />}
            {step === 5 && <Step5 data={data} set={set} errors={errors} />}
            {step === 6 && <Step6 data={data} config={assetConfig} set={set} saving={saving} onDraft={() => saveAsset("borrador")} onSubmit={() => saveAsset("enviado_a_revision")} />}

            <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", alignItems: "center" }}>
              {step > 1 && <button onClick={prev} style={BTN_SECONDARY}>← Anterior</button>}
              {step < 6 && <button onClick={next} style={{ ...BTN_PRIMARY, marginLeft: "auto" }}>Siguiente →</button>}
              {step > 2 && step < 6 && (
                <button onClick={() => saveAsset("borrador")} disabled={saving} style={{ ...BTN_SECONDARY, fontSize: "0.82rem", padding: "10px 18px" }}>
                  {saving ? "Guardando..." : "💾 Borrador"}
                </button>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

// ── Paso 1: Básicos ───────────────────────────────────────────────────────────
function Step1({ data, set, errors }: { data: WizardData; set: (k: string, v: string) => void; errors: Record<string, string> }) {
  function Field({ k, label, required, type = "text", hint }: { k: keyof WizardData; label: string; required?: boolean; type?: string; hint?: string }) {
    const v = data[k] as string;
    const err = errors[k as string];
    const border = err ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.1)";
    return (
      <div>
        <label style={LABEL_STYLE}>{label}{required && <span style={{ color: "#FF9A00", marginLeft: 4 }}>*</span>}</label>
        {hint && <p style={{ color: "#6B7280", fontSize: "0.76rem", marginBottom: 6 }}>{hint}</p>}
        {type === "textarea"
          ? <textarea value={v} onChange={e => set(k as string, e.target.value)} rows={type === "textarea" ? 3 : 1}
              style={{ ...INPUT_STYLE, border, resize: "vertical", fontFamily: "inherit" }} />
          : <input type={type} value={v} onChange={e => set(k as string, e.target.value)} style={{ ...INPUT_STYLE, border }} />}
        {err && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginTop: 4 }}>{err}</p>}
      </div>
    );
  }
  function Sel({ k, label, options }: { k: keyof WizardData; label: string; options: string[] }) {
    return (
      <div>
        <label style={LABEL_STYLE}>{label}</label>
        <select value={data[k] as string} onChange={e => set(k as string, e.target.value)} style={{ ...INPUT_STYLE, appearance: "none" }}>
          <option value="">Seleccioná</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 4, fontSize: "1.05rem" }}>Tipo de activo</h2>
        <p style={{ color: "#A1A1AA", fontSize: "0.82rem", marginBottom: 16 }}>Seleccioná la categoría que mejor describe tu activo</p>
        {errors.assetTypeId && <p style={{ color: "#EF4444", fontSize: "0.82rem", marginBottom: 12 }}>{errors.assetTypeId}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {ASSET_TYPES.map(t => (
            <button key={t.id} onClick={() => set("assetTypeId", t.id)} style={{
              background: data.assetTypeId === t.id ? "rgba(255,154,0,0.12)" : "#0D0D0D",
              border: `1.5px solid ${data.assetTypeId === t.id ? "#FF9A00" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12, padding: "14px 12px", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{t.icon}</div>
              <div style={{ color: data.assetTypeId === t.id ? "#FF9A00" : "#fff", fontWeight: 700, fontSize: "0.82rem" }}>{t.label}</div>
              <div style={{ color: "#6B7280", fontSize: "0.72rem", marginTop: 2, lineHeight: 1.3 }}>{t.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: "1.05rem" }}>Información general</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field k="nombre_del_activo" label="Nombre del activo" required />
          <Field k="subtitulo" label="Subtítulo" />
          <Field k="descripcion_corta" label="Descripción corta" required type="textarea" hint="Máximo 2 oraciones. Aparece en el listado del marketplace." />
          <Field k="descripcion_completa" label="Descripción completa" required type="textarea" />
          <Field k="objetivo_de_la_tokenizacion" label="Objetivo de la tokenización" required type="textarea" />
          <Sel k="estado_actual_del_proyecto" label="Estado actual del proyecto" options={ESTADO_PROYECTO_OPTIONS} />
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: "1.05rem" }}>Ubicación</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}><Sel k="pais" label="País" options={PAISES} /></div>
          <Field k="provincia_estado" label="Provincia / Estado" />
          <Field k="ciudad" label="Ciudad" />
          <div style={{ gridColumn: "1/-1" }}><Field k="direccion_referencial" label="Dirección referencial" /></div>
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: "1.05rem" }}>Empresa y contacto</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}><Field k="empresa_emisora" label="Empresa emisora" required /></div>
          <div style={{ gridColumn: "1/-1" }}><Field k="responsable_del_proyecto" label="Responsable del proyecto" required /></div>
          <Field k="email_contacto" label="Email de contacto" required type="email" />
          <Field k="telefono_contacto" label="Teléfono" type="tel" />
          <div style={{ gridColumn: "1/-1" }}><Field k="sitio_web" label="Sitio web" type="url" /></div>
        </div>
      </div>
    </div>
  );
}

// ── Paso 2: Específico ────────────────────────────────────────────────────────
function Step2({ data, config, errors, setSpecific }: { data: WizardData; config?: AssetTypeConfig; errors: Record<string, string>; setSpecific: (k: string, v: string) => void }) {
  if (!config) return (
    <div style={{ ...CARD, textAlign: "center", padding: 40 }}>
      <p style={{ color: "#A1A1AA" }}>Volvé al Paso 1 y seleccioná un tipo de activo.</p>
    </div>
  );

  const mid = Math.ceil(config.fields.length / 2);
  const parts = [config.fields.slice(0, mid), config.fields.slice(mid)];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "rgba(255,154,0,0.06)", border: "1px solid rgba(255,154,0,0.2)", borderRadius: 12, padding: "12px 18px" }}>
        <span style={{ fontSize: "1.1rem", marginRight: 8 }}>{config.icon}</span>
        <span style={{ color: "#FF9A00", fontWeight: 700 }}>{config.label}</span>
        <span style={{ color: "#A1A1AA", marginLeft: 8, fontSize: "0.84rem" }}>— {config.description}</span>
      </div>
      {parts.map((group, gi) => (
        <div key={gi} style={CARD}>
          <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 18, fontSize: "1rem" }}>
            {gi === 0 ? "Datos específicos — parte 1 de 2" : "Datos específicos — parte 2 de 2"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {group.map(field => (
              <DynamicField key={field.key} field={field}
                value={data.specificFields[field.key] ?? ""}
                onChange={v => setSpecific(field.key, v)}
                error={errors[`sp_${field.key}`]} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Paso 3: Tokenización ──────────────────────────────────────────────────────
function Step3({ data, set, errors }: { data: WizardData; set: (k: string, v: string) => void; errors: Record<string, string> }) {
  const precioAuto = data.monto_a_tokenizar && data.cantidad_estimada_de_tokens
    ? (parseFloat(data.monto_a_tokenizar) / parseFloat(data.cantidad_estimada_de_tokens)).toFixed(4) : "";

  function N(k: keyof WizardData, label: string, required = false, hint?: string, prefix?: string) {
    const err = errors[k as string];
    return (
      <div>
        <label style={LABEL_STYLE}>{label}{required && <span style={{ color: "#FF9A00", marginLeft: 4 }}>*</span>}</label>
        {hint && <p style={{ color: "#6B7280", fontSize: "0.76rem", marginBottom: 6 }}>{hint}</p>}
        <div style={{ position: "relative" }}>
          {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#A1A1AA" }}>{prefix}</span>}
          <input type="number" min={0} value={data[k] as string} onChange={e => set(k as string, e.target.value)}
            style={{ ...INPUT_STYLE, border: err ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.1)", paddingLeft: prefix ? 26 : 14 }} />
        </div>
        {err && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginTop: 4 }}>{err}</p>}
      </div>
    );
  }
  function T(k: keyof WizardData, label: string, required = false, hint?: string) {
    const err = errors[k as string];
    return (
      <div>
        <label style={LABEL_STYLE}>{label}{required && <span style={{ color: "#FF9A00", marginLeft: 4 }}>*</span>}</label>
        {hint && <p style={{ color: "#6B7280", fontSize: "0.76rem", marginBottom: 6 }}>{hint}</p>}
        <input type="text" value={data[k] as string} onChange={e => set(k as string, e.target.value)}
          style={{ ...INPUT_STYLE, border: err ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.1)" }} />
        {err && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginTop: 4 }}>{err}</p>}
      </div>
    );
  }
  function TA(k: keyof WizardData, label: string, required = false, hint?: string) {
    const err = errors[k as string];
    return (
      <div>
        <label style={LABEL_STYLE}>{label}{required && <span style={{ color: "#FF9A00", marginLeft: 4 }}>*</span>}</label>
        {hint && <p style={{ color: "#6B7280", fontSize: "0.76rem", marginBottom: 6 }}>{hint}</p>}
        <textarea value={data[k] as string} onChange={e => set(k as string, e.target.value)} rows={3}
          style={{ ...INPUT_STYLE, border: err ? "1px solid #EF4444" : "1px solid rgba(255,255,255,0.1)", resize: "vertical", fontFamily: "inherit" }} />
        {err && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginTop: 4 }}>{err}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 18, fontSize: "1.05rem" }}>Valor del activo</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>{N("valor_total_estimado", "Valor total estimado del activo", true, undefined, "$")}</div>
          <div>{N("monto_a_tokenizar", "Monto a tokenizar", true, "Parte del valor total", "$")}</div>
          <div>
            <label style={LABEL_STYLE}>Porcentaje a tokenizar</label>
            <div style={{ position: "relative" }}>
              <input type="number" min={0} max={100} value={data.porcentaje_del_activo_a_tokenizar}
                onChange={e => set("porcentaje_del_activo_a_tokenizar", e.target.value)}
                style={{ ...INPUT_STYLE, border: "1px solid rgba(255,255,255,0.1)" }} />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#A1A1AA" }}>%</span>
            </div>
          </div>
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 18, fontSize: "1.05rem" }}>Estructura de tokens</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>{N("cantidad_estimada_de_tokens", "Cantidad de tokens", true)}</div>
          <div>
            <label style={LABEL_STYLE}>Precio por token (auto)</label>
            <div style={{ ...INPUT_STYLE, border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 6, color: precioAuto ? "#FF9A00" : "#555" }}>
              <span style={{ color: "#A1A1AA" }}>$</span>{precioAuto || "—"}
            </div>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={LABEL_STYLE}>Moneda</label>
            <select value={data.moneda} onChange={e => set("moneda", e.target.value)} style={{ ...INPUT_STYLE, appearance: "none" }}>
              {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 18, fontSize: "1.05rem" }}>Proyección financiera</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {T("rentabilidad_estimada", "Rentabilidad estimada", true, "Ej: 8% anual en USD")}
          {T("horizonte_del_proyecto", "Horizonte del proyecto", true, "Ej: 5 años")}
          {TA("uso_de_fondos", "Uso de fondos", true, "Describí en detalle cómo se usará el capital recaudado")}
          {TA("riesgos_principales", "Riesgos principales", true, "Descripción honesta de los riesgos relevantes")}
        </div>
      </div>
    </div>
  );
}

// ── Paso 4: Documentos ────────────────────────────────────────────────────────
function Step4({ data, config, setDoc }: { data: WizardData; config?: AssetTypeConfig; setDoc: (k: string, v: string) => void }) {
  const reqDocs = [...COMMON_DOCUMENTS.filter(d => d.required), ...(config?.requiredDocuments ?? [])];
  const optDocs = [...COMMON_DOCUMENTS.filter(d => !d.required), ...(config?.optionalDocuments ?? [])];
  const completed = reqDocs.filter(d => data.documents[d.key]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "rgba(255,154,0,0.08)", border: "1px solid rgba(255,154,0,0.2)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <p style={{ color: "#FF9A00", fontWeight: 700, fontSize: "0.9rem" }}>Documentos requeridos</p>
          <p style={{ color: "#A1A1AA", fontSize: "0.8rem", marginTop: 2 }}>{completed} de {reqDocs.length} adjuntados</p>
        </div>
        <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ width: `${reqDocs.length ? (completed / reqDocs.length) * 100 : 0}%`, height: "100%", background: "#FF9A00" }} />
        </div>
      </div>

      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 6, fontSize: "1.05rem" }}>Documentos requeridos</h2>
        <p style={{ color: "#A1A1AA", fontSize: "0.82rem", marginBottom: 16 }}>Obligatorios para enviar a revisión.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reqDocs.map(d => (
            <DocUploader key={d.key} label={d.label} required hint={d.hint} accept={d.accept}
              multiple={d.multiple} value={data.documents[d.key] ?? ""} onChange={v => setDoc(d.key, v)} />
          ))}
        </div>
      </div>

      {optDocs.length > 0 && (
        <div style={CARD}>
          <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 6, fontSize: "1.05rem" }}>Documentos opcionales</h2>
          <p style={{ color: "#A1A1AA", fontSize: "0.82rem", marginBottom: 16 }}>Más documentación accelera la revisión.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {optDocs.map(d => (
              <DocUploader key={d.key} label={d.label} required={false} hint={d.hint} accept={d.accept}
                multiple={d.multiple} value={data.documents[d.key] ?? ""} onChange={v => setDoc(d.key, v)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Paso 5: Multimedia ────────────────────────────────────────────────────────
function Step5({ data, set, errors }: { data: WizardData; set: (k: string, v: string) => void; errors: Record<string, string> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 6, fontSize: "1.05rem" }}>Imagen principal <span style={{ color: "#FF9A00" }}>*</span></h2>
        <p style={{ color: "#A1A1AA", fontSize: "0.82rem", marginBottom: 16 }}>La imagen principal que verán los inversores en el marketplace.</p>
        <DocUploader label="Imagen principal del activo" required accept=".jpg,.jpeg,.png,.webp"
          hint="Resolución mínima recomendada: 1200 x 800px" value={data.imagen_principal}
          onChange={v => set("imagen_principal", v)} />
        {errors.imagen_principal && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginTop: 8 }}>{errors.imagen_principal}</p>}
      </div>
      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 6, fontSize: "1.05rem" }}>Galería</h2>
        <p style={{ color: "#A1A1AA", fontSize: "0.82rem", marginBottom: 16 }}>Hasta 10 imágenes adicionales.</p>
        <DocUploader label="Galería de imágenes" required={false} accept=".jpg,.jpeg,.png,.webp"
          hint="Seleccioná múltiples archivos a la vez" multiple value={data.galeria_de_imagenes}
          onChange={v => set("galeria_de_imagenes", v)} />
      </div>
      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 14, fontSize: "1.05rem" }}>Material adicional</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <DocUploader label="Video de presentación" required={false} accept=".mp4,.mov"
            hint="Video de hasta 5 minutos" value={data.video_presentacion}
            onChange={v => set("video_presentacion", v)} />
          <DocUploader label="Presentación / Brochure PDF" required={false} accept=".pdf"
            hint="Documento con información detallada" value={data.presentacion_pdf}
            onChange={v => set("presentacion_pdf", v)} />
        </div>
      </div>
    </div>
  );
}

// ── Paso 6: Envío ─────────────────────────────────────────────────────────────
function Step6({ data, config, set, saving, onDraft, onSubmit }: {
  data: WizardData; config?: AssetTypeConfig; set: (k: string, v: string | boolean) => void;
  saving: boolean; onDraft: () => void; onSubmit: () => void;
}) {
  const reqDocs = [...COMMON_DOCUMENTS.filter(d => d.required), ...(config?.requiredDocuments ?? [])];
  const completed = reqDocs.filter(d => data.documents[d.key]).length;
  const canSubmit = data.acepta_declaracion && data.acepta_autorizacion &&
    data.nombre_del_activo && data.monto_a_tokenizar &&
    completed >= Math.ceil(reqDocs.length * 0.7);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: "1.05rem" }}>Resumen</h2>
        {[
          ["Tipo", config?.label ?? "—"],
          ["Nombre", data.nombre_del_activo || "—"],
          ["Empresa", data.empresa_emisora || "—"],
          ["País", data.pais || "—"],
          ["Monto", data.monto_a_tokenizar ? `${data.moneda} ${Number(data.monto_a_tokenizar).toLocaleString()}` : "—"],
          ["Tokens", data.cantidad_estimada_de_tokens ? Number(data.cantidad_estimada_de_tokens).toLocaleString() : "—"],
          ["Rentabilidad", data.rentabilidad_estimada || "—"],
          ["Horizonte", data.horizonte_del_proyecto || "—"],
          ["Documentos", `${completed}/${reqDocs.length} requeridos`],
          ["Imagen", data.imagen_principal || "—"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 0" }}>
            <span style={{ color: "#A1A1AA", fontSize: "0.84rem" }}>{k}</span>
            <span style={{ color: "#fff", fontSize: "0.84rem", fontWeight: 600, textAlign: "right", maxWidth: "65%" }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={CARD}>
        <h2 style={{ color: "#fff", fontWeight: 700, marginBottom: 16, fontSize: "1.05rem" }}>Declaración jurada</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { k: "acepta_declaracion", txt: "Declaro que toda la información provista es veraz, completa y verificable. Entiendo que Mercado Token validará la documentación antes de publicar el activo en el marketplace." },
            { k: "acepta_autorizacion", txt: "Autorizo a Mercado Token a verificar la información, contactarme para solicitar documentación adicional y usar los datos exclusivamente para el proceso de validación." },
          ].map(({ k, txt }) => (
            <label key={k} style={{ display: "flex", gap: 12, cursor: "pointer", alignItems: "flex-start" }}>
              <input type="checkbox" checked={data[k as keyof WizardData] as boolean}
                onChange={e => set(k, e.target.checked)}
                style={{ marginTop: 3, accentColor: "#FF9A00", width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ color: "#A1A1AA", fontSize: "0.84rem", lineHeight: 1.5 }}>{txt}</span>
            </label>
          ))}
        </div>
      </div>

      {!canSubmit && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px" }}>
          <p style={{ color: "#FCA5A5", fontSize: "0.82rem" }}>
            Para enviar necesitás: aceptar ambas declaraciones, completar nombre y monto, y adjuntar al menos el 70% de los documentos requeridos.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={onDraft} disabled={saving} style={{ ...BTN_SECONDARY, flex: 1, minWidth: 140 }}>
          {saving ? "Guardando..." : "💾 Guardar borrador"}
        </button>
        <button onClick={onSubmit} disabled={!canSubmit || saving} style={{ ...BTN_PRIMARY, flex: 2, minWidth: 160, opacity: canSubmit ? 1 : 0.4 }}>
          {saving ? "Enviando..." : "🚀 Enviar a revisión"}
        </button>
      </div>
    </div>
  );
}
