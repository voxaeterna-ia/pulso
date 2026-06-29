"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAsset, createIntention } from "@/lib/services/firestore";
import { Asset } from "@/types";
import { SECTORS } from "@/lib/constants";

export default function InversionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [submitting, setSubmitting] = useState(false);
  const [intentionId, setIntentionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && user.role !== "inversor") { router.push("/dashboard"); return; }
  }, [user, loading, router]);

  useEffect(() => {
    if (!assetId) return;
    getAsset(assetId).then(a => { setAsset(a); setDataLoading(false); });
  }, [assetId]);

  if (loading || !user || dataLoading) return <Spinner />;

  if (!asset || asset.status !== "listed") return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-24 px-4 max-w-2xl mx-auto text-center">
        <div className="text-4xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-white mb-2">Activo no disponible</h1>
        <Link href="/marketplace" style={{ color: "#FF9A00" }}>← Volver al marketplace</Link>
      </main>
    </div>
  );

  if (user.kycStatus !== "aprobado") return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-24 px-4 max-w-2xl mx-auto text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-white mb-2">KYC requerido</h1>
        <p className="text-sm mb-4" style={{ color: "#A1A1AA" }}>Para invertir necesitás completar y aprobar tu verificación de identidad.</p>
        <Link href="/perfil" className="inline-block px-5 py-2.5 rounded-lg font-semibold"
              style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
          Completar KYC →
        </Link>
      </main>
    </div>
  );

  const sector = SECTORS.find(s => s.id === asset.assetType);
  const amountNum = Number(amount);
  const estimatedTokens = asset.tokenPrice > 0 ? Math.floor(amountNum / asset.tokenPrice) : 0;
  const minAmount = asset.tokenPrice;

  async function handleSubmit() {
    if (!user || !asset) return;
    setSubmitting(true);
    setError("");
    try {
      const id = await createIntention({
        investorId: user.id,
        investorName: user.name,
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.assetType,
        amountUSD: amountNum,
        estimatedTokens,
        tokenPrice: asset.tokenPrice,
        status: "initiated",
        notes: "",
      });
      setIntentionId(id);
      setStep("done");
    } catch (e) {
      setError("Ocurrió un error al registrar la intención. Por favor intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-2xl mx-auto">

        <Link href={`/marketplace/${asset.id}`} className="inline-flex items-center gap-2 mt-6 mb-6 text-sm"
              style={{ color: "#6B6358", textDecoration: "none" }}>
          ← Volver al activo
        </Link>

        {/* Activo resumen */}
        <div className="p-4 rounded-xl mb-6 flex items-center gap-4"
             style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-3xl">{sector?.icon ?? "📦"}</span>
          <div>
            <div className="font-bold text-white">{asset.name}</div>
            <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>{asset.city}, {asset.country} · USD {asset.tokenPrice}/token</div>
          </div>
        </div>

        {step === "done" ? (
          /* Confirmación final */
          <div className="rounded-xl p-8 text-center" style={{ background: "#111", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Intención registrada</h2>
            <p className="text-sm mb-6" style={{ color: "#A1A1AA" }}>
              Tu intención de inversión fue recibida. El equipo de Mercado Token la revisará y te notificará el estado.
              Los fondos quedarán retenidos en custodia hasta la aprobación.
            </p>
            <div className="p-4 rounded-xl mb-6" style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs mb-3 font-semibold" style={{ color: "#6B6358" }}>RESUMEN DE TU INTENCIÓN</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: "#A1A1AA" }}>Activo</span><span className="text-white font-semibold">{asset.name}</span></div>
                <div className="flex justify-between"><span style={{ color: "#A1A1AA" }}>Monto</span><span className="text-white font-semibold">USD {amountNum.toLocaleString()}</span></div>
                <div className="flex justify-between"><span style={{ color: "#A1A1AA" }}>Tokens estimados</span><span className="text-white font-semibold">{estimatedTokens.toLocaleString()}</span></div>
                <div className="flex justify-between"><span style={{ color: "#A1A1AA" }}>Estado</span><span style={{ color: "#3B82F6", fontWeight: 600 }}>En revisión</span></div>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/inversiones"
                    className="px-5 py-2.5 rounded-lg font-semibold text-sm"
                    style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
                Ver mis inversiones
              </Link>
              <Link href="/marketplace"
                    className="px-5 py-2.5 rounded-lg text-sm"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A1A1AA", textDecoration: "none" }}>
                Explorar más
              </Link>
            </div>
          </div>
        ) : step === "confirm" ? (
          /* Pantalla de confirmación */
          <div className="rounded-xl p-6" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-bold text-white text-lg mb-6">Confirmá tu intención de inversión</h2>
            <div className="space-y-3 mb-6">
              {[
                { label: "Activo",          value: asset.name },
                { label: "Monto (USD)",     value: `USD ${amountNum.toLocaleString()}` },
                { label: "Precio/token",    value: `USD ${asset.tokenPrice}` },
                { label: "Tokens estimados",value: estimatedTokens.toLocaleString() },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b"
                     style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <span className="text-sm" style={{ color: "#6B6358" }}>{item.label}</span>
                  <span className="font-semibold text-white text-sm">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl mb-6 text-xs" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", color: "#A1A1AA" }}>
              <div className="font-semibold mb-1" style={{ color: "#8B5CF6" }}>¿Cómo funciona el escrow?</div>
              Al confirmar, tu intención quedará registrada y <strong style={{ color: "#fff" }}>los fondos serán retenidos por Mercado Token</strong> hasta que se verifiquen las condiciones de la operación. Si la operación no se completa, los fondos son devueltos. No se realizan movimientos reales de dinero en esta versión MVP.
            </div>

            {error && <div className="mb-4 p-3 rounded-lg text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>{error}</div>}

            <div className="flex gap-3">
              <button onClick={() => setStep("form")} className="flex-1 py-2.5 rounded-lg text-sm"
                      style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A1A1AA" }}>
                ← Volver
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                      className="flex-1 py-2.5 rounded-lg font-bold text-sm"
                      style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
                {submitting ? "Registrando..." : "Confirmar intención →"}
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de monto */
          <div className="rounded-xl p-6" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-bold text-white text-lg mb-2">Indicá tu intención de inversión</h2>
            <p className="text-sm mb-6" style={{ color: "#A1A1AA" }}>
              Esta es una expresión de interés. No implica pago inmediato. Mercado Token validará la operación antes de proceder.
            </p>

            <div className="mb-5">
              <label className="block text-xs mb-2" style={{ color: "#A1A1AA" }}>Monto en USD *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "#6B6358" }}>USD</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min={minAmount}
                  placeholder={`Mínimo USD ${minAmount}`}
                  className="w-full pl-12 pr-4 py-3 rounded-lg text-white text-lg font-semibold outline-none"
                  style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: "#6B6358" }}>
                Precio por token: USD {asset.tokenPrice} · Mínimo: USD {minAmount}
              </div>
            </div>

            {amountNum >= minAmount && (
              <div className="p-4 rounded-xl mb-6" style={{ background: "#0A0A0A", border: "1px solid rgba(255,154,0,0.15)" }}>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div style={{ color: "#6B6358" }}>Monto</div>
                    <div className="font-bold text-white text-base">USD {amountNum.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: "#6B6358" }}>Tokens est.</div>
                    <div className="font-bold text-white text-base">{estimatedTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: "#6B6358" }}>Retorno est.</div>
                    <div className="font-bold text-base" style={{ color: "#10B981" }}>{asset.expectedReturn ?? "—"}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => { if (amountNum >= minAmount) setStep("confirm"); }}
              disabled={amountNum < minAmount}
              className="w-full py-3 rounded-lg font-bold text-sm transition"
              style={{
                background: amountNum >= minAmount ? "linear-gradient(135deg, #FF9A00, #D4AF37)" : "#222",
                color: amountNum >= minAmount ? "#000" : "#6B6358",
                cursor: amountNum >= minAmount ? "pointer" : "not-allowed",
              }}>
              Continuar →
            </button>

            <p className="text-xs text-center mt-4" style={{ color: "#52525B" }}>
              Mercado Token actúa como intermediario de confianza. Los fondos quedan retenidos hasta la validación completa de la operación.
            </p>
          </div>
        )}

      </main>
      <Footer />
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
