"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createAsset, updateAsset } from "@/lib/services/firestore";
import { AssetType } from "@/types";
import { SECTORS } from "@/lib/constants";

const ASSET_SPECIFIC_FIELDS: Record<string, { label: string; key: string; type?: string }[]> = {
  "real-estate": [
    { label: "Tipo de inmueble", key: "propertyType" },
    { label: "Superficie total (m²)", key: "totalSqm", type: "number" },
    { label: "Superficie cubierta (m²)", key: "coveredSqm", type: "number" },
    { label: "Ambientes", key: "rooms", type: "number" },
    { label: "Baños", key: "bathrooms", type: "number" },
    { label: "Estado de construcción", key: "constructionStatus" },
    { label: "Año de construcción", key: "constructionYear", type: "number" },
    { label: "Amenities", key: "amenities" },
    { label: "Renta actual (USD/mes)", key: "currentRent", type: "number" },
    { label: "Renta proyectada (USD/mes)", key: "projectedRent", type: "number" },
    { label: "Estado de ocupación", key: "occupancyStatus" },
  ],
  "startups": [
    { label: "Etapa de la startup", key: "startupStage" },
    { label: "Industria / Vertical", key: "industry" },
    { label: "Fundadores", key: "founders" },
    { label: "MRR / ARR (USD)", key: "revenue", type: "number" },
    { label: "Uso de los fondos", key: "useOfFunds" },
  ],
  "energia": [
    { label: "Tipo de energía", key: "energyType" },
    { label: "Capacidad (MW)", key: "capacityMW", type: "number" },
    { label: "Contrato de suministro", key: "supplyContract" },
    { label: "Vida útil del proyecto (años)", key: "projectLifeYears", type: "number" },
  ],
  "agro": [
    { label: "Tipo de cultivo / actividad", key: "cropType" },
    { label: "Superficie (ha)", key: "areHectares", type: "number" },
    { label: "Rendimiento estimado (ton/ha)", key: "estimatedYield", type: "number" },
    { label: "Ciclo productivo", key: "productiveCycle" },
  ],
};

type FormData = Record<string, string | number>;

const STEPS = ["Tipo y datos básicos", "Economía", "Descripción y riesgos", "Confirmación"];

export default function NuevoActivoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    assetType: "real-estate",
    name: "",
    shortDescription: "",
    fullDescription: "",
    country: "Argentina",
    state: "",
    city: "",
    address: "",
    estimatedValue: "",
    tokenizationAmount: "",
    estimatedTokenCount: "",
    tokenPrice: "",
    currency: "USD",
    expectedReturn: "",
    projectHorizon: "",
    risks: "",
  });

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && user.role !== "emisor") { router.push("/dashboard"); return; }
  }, [user, loading, router]);

  if (loading || !user) return <Spinner />;

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function calcTokens() {
    const amount = Number(form.tokenizationAmount);
    const price  = Number(form.tokenPrice);
    if (amount > 0 && price > 0) {
      set("estimatedTokenCount", Math.floor(amount / price));
    }
  }

  async function saveDraft() {
    if (!user) return;
    setSaving(true);
    try {
      const base = {
        issuerId: user.id,
        issuerName: user.name,
        assetType: form.assetType as AssetType,
        name: String(form.name),
        shortDescription: String(form.shortDescription),
        fullDescription: String(form.fullDescription),
        country: String(form.country),
        state: String(form.state),
        city: String(form.city),
        address: String(form.address),
        estimatedValue: Number(form.estimatedValue),
        tokenizationAmount: Number(form.tokenizationAmount),
        estimatedTokenCount: Number(form.estimatedTokenCount),
        tokenPrice: Number(form.tokenPrice),
        currency: (form.currency as "USD" | "ARS" | "EUR") ?? "USD",
        expectedReturn: String(form.expectedReturn),
        projectHorizon: String(form.projectHorizon),
        risks: String(form.risks),
        tokensTotal: Number(form.estimatedTokenCount),
        tokensAvailable: Number(form.estimatedTokenCount),
        fundedPercent: 0,
        status: "draft" as const,
      };
      if (savedId) {
        await updateAsset(savedId, base);
      } else {
        const id = await createAsset(base);
        setSavedId(id);
      }
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    if (!savedId) await saveDraft();
    if (!savedId) return;
    await updateAsset(savedId, { status: "submitted" });
    router.push("/emisor/activos?submitted=1");
  }

  const specificFields = ASSET_SPECIFIC_FIELDS[form.assetType as string] ?? [];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-3xl mx-auto">

        <div className="mt-6 mb-8">
          <Link href="/emisor/activos" className="text-sm" style={{ color: "#6B6358", textDecoration: "none" }}>← Mis activos</Link>
          <h1 className="text-2xl font-bold text-white mt-2">Cargar nuevo activo</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                     style={{
                       background: i < step ? "#10B981" : i === step ? "#FF9A00" : "#222",
                       color: i <= step ? "#000" : "#6B6358",
                     }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="text-xs hidden md:block" style={{ color: i === step ? "#FF9A00" : "#6B6358" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? "#10B981" : "#222" }} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl p-6" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>

          {/* PASO 0: Tipo y datos básicos */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-bold text-white text-lg">Tipo y datos básicos</h2>

              <div>
                <label className="block text-xs mb-2" style={{ color: "#A1A1AA" }}>Tipo de activo *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SECTORS.map(s => (
                    <button key={s.id} onClick={() => set("assetType", s.id)}
                            className="p-3 rounded-lg text-xs text-left transition"
                            style={{
                              background: form.assetType === s.id ? "rgba(255,154,0,0.15)" : "rgba(255,255,255,0.03)",
                              border: `1px solid ${form.assetType === s.id ? "rgba(255,154,0,0.4)" : "rgba(255,255,255,0.08)"}`,
                              color: form.assetType === s.id ? "#FF9A00" : "#A1A1AA",
                            }}>
                      <span className="text-lg block mb-1">{s.icon}</span>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Nombre del activo *" value={String(form.name)} onChange={v => set("name", v)} placeholder="Ej: Torre Catalinas Norte" />
              <Field label="Descripción corta *" value={String(form.shortDescription)} onChange={v => set("shortDescription", v)} placeholder="Una línea que describe el activo" />

              <div className="grid grid-cols-3 gap-4">
                <Field label="País *" value={String(form.country)} onChange={v => set("country", v)} />
                <Field label="Provincia/Estado *" value={String(form.state)} onChange={v => set("state", v)} />
                <Field label="Ciudad *" value={String(form.city)} onChange={v => set("city", v)} />
              </div>
              <Field label="Dirección / Ubicación" value={String(form.address)} onChange={v => set("address", v)} />

              {/* Campos específicos del tipo */}
              {specificFields.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "#6B6358" }}>
                    Campos específicos — {SECTORS.find(s => s.id === form.assetType)?.name}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {specificFields.map(f => (
                      <Field key={f.key} label={f.label} type={f.type ?? "text"}
                             value={String(form[f.key] ?? "")} onChange={v => set(f.key, f.type === "number" ? Number(v) : v)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 1: Economía */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-bold text-white text-lg">Datos económicos</h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Valor estimado del activo (USD) *" type="number" value={String(form.estimatedValue)} onChange={v => set("estimatedValue", v)} />
                <Field label="Monto a tokenizar (USD) *" type="number" value={String(form.tokenizationAmount)} onChange={v => set("tokenizationAmount", v)} />
                <Field label="Precio estimado por token (USD) *" type="number" value={String(form.tokenPrice)} onChange={v => { set("tokenPrice", v); }} />
                <div>
                  <label className="block text-xs mb-2" style={{ color: "#A1A1AA" }}>Cantidad estimada de tokens</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={String(form.estimatedTokenCount)}
                      onChange={e => set("estimatedTokenCount", e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                      style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <button onClick={calcTokens} className="px-3 py-2 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(255,154,0,0.15)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.3)" }}>
                      Calcular
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "#A1A1AA" }}>Moneda</label>
                  <select value={String(form.currency)} onChange={e => set("currency", e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                          style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <Field label="Retorno estimado (ej: 8.5%)" value={String(form.expectedReturn)} onChange={v => set("expectedReturn", v)} />
                <Field label="Horizonte del proyecto (ej: 36 meses)" value={String(form.projectHorizon)} onChange={v => set("projectHorizon", v)} />
              </div>

              {/* Resumen */}
              {Number(form.estimatedTokenCount) > 0 && (
                <div className="p-4 rounded-xl mt-2" style={{ background: "#0A0A0A", border: "1px solid rgba(255,154,0,0.15)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "#FF9A00" }}>Resumen de tokenización</div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><span style={{ color: "#6B6358" }}>Total activo:</span><br /><strong className="text-white">USD {Number(form.estimatedValue).toLocaleString()}</strong></div>
                    <div><span style={{ color: "#6B6358" }}>Tokens totales:</span><br /><strong className="text-white">{Number(form.estimatedTokenCount).toLocaleString()}</strong></div>
                    <div><span style={{ color: "#6B6358" }}>Precio/token:</span><br /><strong className="text-white">USD {form.tokenPrice}</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: Descripción y riesgos */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-white text-lg">Descripción completa y riesgos</h2>
              <TextareaField label="Descripción completa *" value={String(form.fullDescription)}
                             onChange={v => set("fullDescription", v)} rows={6}
                             placeholder="Describí en detalle el activo, su historia, características, modelo de negocio, etc." />
              <TextareaField label="Riesgos declarados *" value={String(form.risks)}
                             onChange={v => set("risks", v)} rows={4}
                             placeholder="Declarar los riesgos conocidos: liquidez, mercado, regulatorios, operativos, etc." />
              <div className="p-4 rounded-xl text-xs" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", color: "#A1A1AA" }}>
                💡 La documentación legal y técnica podrá cargarse luego desde el panel de tu activo. El equipo de Mercado Token te contactará para solicitarla.
              </div>
            </div>
          )}

          {/* PASO 3: Confirmación */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-bold text-white text-lg">Confirmación y envío</h2>
              <div className="space-y-3">
                {[
                  { label: "Tipo",              value: SECTORS.find(s => s.id === form.assetType)?.name ?? form.assetType },
                  { label: "Nombre",            value: form.name },
                  { label: "Ubicación",         value: `${form.city}, ${form.state}, ${form.country}` },
                  { label: "Valor del activo",  value: `USD ${Number(form.estimatedValue).toLocaleString()}` },
                  { label: "A tokenizar",       value: `USD ${Number(form.tokenizationAmount).toLocaleString()}` },
                  { label: "Precio por token",  value: `USD ${form.tokenPrice}` },
                  { label: "Tokens estimados",  value: Number(form.estimatedTokenCount).toLocaleString() },
                  { label: "Retorno est.",      value: form.expectedReturn || "—" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b"
                       style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <span className="text-xs" style={{ color: "#6B6358" }}>{item.label}</span>
                    <span className="text-sm font-semibold text-white">{String(item.value)}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl mt-2 text-xs" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", color: "#A1A1AA" }}>
                Al enviar, el activo quedará en estado <strong style={{ color: "#F59E0B" }}>En revisión</strong>. El equipo de Mercado Token lo revisará y te notificará el resultado. Ningún activo se publica sin aprobación previa.
              </div>
            </div>
          )}

          {/* Botones navegación */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                        className="px-4 py-2 rounded-lg text-sm"
                        style={{ color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.1)" }}>
                  ← Anterior
                </button>
              )}
              <button onClick={saveDraft} disabled={saving}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ color: "#6B6358", border: "1px solid rgba(255,255,255,0.08)" }}>
                {saving ? "Guardando..." : "Guardar borrador"}
              </button>
            </div>

            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                      className="px-5 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
                Siguiente →
              </button>
            ) : (
              <button onClick={submit} disabled={saving}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold"
                      style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
                {saving ? "Enviando..." : "Enviar a revisión →"}
              </button>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs mb-2" style={{ color: "#A1A1AA" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
             className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
             style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }} />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 4, placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs mb-2" style={{ color: "#A1A1AA" }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none resize-none"
                style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }} />
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#FF9A00", borderTopColor: "transparent" }} />
    </div>
  );
}
