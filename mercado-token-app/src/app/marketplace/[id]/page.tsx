"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAsset } from "@/lib/services/firestore";
import { Asset } from "@/types";
import { SECTORS } from "@/lib/constants";

export default function AssetDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!id) return;
    getAsset(id).then(a => { setAsset(a); setDataLoading(false); });
  }, [id]);

  if (loading || !user || dataLoading) return <Spinner />;

  if (!asset) return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-24 px-4 max-w-4xl mx-auto text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-white mb-2">Activo no encontrado</h1>
        <Link href="/marketplace" style={{ color: "#FF9A00" }}>← Volver al marketplace</Link>
      </main>
    </div>
  );

  const sector = SECTORS.find(s => s.id === asset.assetType);
  const pct = asset.fundedPercent ?? 0;
  const canInvest = user.role === "inversor" && user.kycStatus === "aprobado";

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-4xl mx-auto">

        <Link href="/marketplace" className="inline-flex items-center gap-2 mt-6 mb-6 text-sm"
              style={{ color: "#6B6358", textDecoration: "none" }}>
          ← Volver al marketplace
        </Link>

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="h-48 flex items-center justify-center"
               style={{ background: "linear-gradient(135deg, #1a1a1a, #111)" }}>
            <span className="text-8xl">{sector?.icon ?? "📦"}</span>
          </div>
          <div className="p-6" style={{ background: "#111" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(255,154,0,0.12)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.25)" }}>
                    {sector?.tag ?? asset.assetType}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
                    Validado ✓
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white">{asset.name}</h1>
                <p className="mt-1 text-sm" style={{ color: "#A1A1AA" }}>{asset.city}, {asset.state}, {asset.country}</p>
              </div>
              <div className="text-right">
                <div className="text-xs" style={{ color: "#6B6358" }}>Precio por token</div>
                <div className="text-2xl font-bold" style={{ color: "#D4AF37" }}>USD {asset.tokenPrice}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">

            {/* Descripción */}
            <div className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="font-bold text-white mb-3">Descripción</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>
                {asset.fullDescription || asset.shortDescription}
              </p>
            </div>

            {/* Datos económicos */}
            <div className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="font-bold text-white mb-4">Datos económicos</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Valor del activo",      value: `USD ${(asset.estimatedValue ?? 0).toLocaleString()}` },
                  { label: "Monto a tokenizar",     value: `USD ${(asset.tokenizationAmount ?? 0).toLocaleString()}` },
                  { label: "Total tokens",           value: (asset.tokensTotal ?? 0).toLocaleString() },
                  { label: "Tokens disponibles",     value: (asset.tokensAvailable ?? 0).toLocaleString() },
                  { label: "Retorno estimado",       value: asset.expectedReturn ?? "—" },
                  { label: "Horizonte",              value: asset.projectHorizon ?? "—" },
                  { label: "Moneda",                 value: asset.currency ?? "USD" },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-lg" style={{ background: "#0A0A0A" }}>
                    <div className="text-xs mb-1" style={{ color: "#6B6358" }}>{item.label}</div>
                    <div className="font-semibold text-white text-sm">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Riesgos */}
            {asset.risks && (
              <div className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <h2 className="font-bold text-white mb-3">Riesgos declarados</h2>
                <p className="text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>{asset.risks}</p>
              </div>
            )}

            {/* Documentación */}
            <div className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="font-bold text-white mb-3">Documentación</h2>
              <div className="space-y-2">
                {asset.legalDocUrl ? (
                  <a href={asset.legalDocUrl} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 p-3 rounded-lg text-sm"
                     style={{ background: "#0A0A0A", color: "#FF9A00", textDecoration: "none" }}>
                    📄 Documentación legal
                  </a>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "#0A0A0A", color: "#6B6358" }}>
                    📄 Documentación legal (pendiente de validación)
                  </div>
                )}
                {asset.technicalDocUrl ? (
                  <a href={asset.technicalDocUrl} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 p-3 rounded-lg text-sm"
                     style={{ background: "#0A0A0A", color: "#FF9A00", textDecoration: "none" }}>
                    📋 Documentación técnica
                  </a>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "#0A0A0A", color: "#6B6358" }}>
                    📋 Documentación técnica (pendiente)
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Financiamiento */}
            <div className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="font-bold text-white mb-3 text-sm">Progreso de financiamiento</h3>
              <div className="text-3xl font-bold mb-1" style={{ color: "#FF9A00" }}>{pct}%</div>
              <div className="w-full h-2 rounded-full mb-3" style={{ background: "#222" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FF9A00, #D4AF37)" }} />
              </div>
              <div className="text-xs" style={{ color: "#6B6358" }}>
                {(asset.tokensAvailable ?? 0).toLocaleString()} tokens disponibles de {(asset.tokensTotal ?? 0).toLocaleString()}
              </div>
            </div>

            {/* Emisor */}
            <div className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="font-bold text-white mb-2 text-sm">Emisor</h3>
              <div className="text-sm" style={{ color: "#A1A1AA" }}>{asset.issuerName}</div>
              <div className="text-xs mt-2 px-2 py-1 rounded-full inline-block"
                   style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
                Verificado por Mercado Token ✓
              </div>
            </div>

            {/* CTA inversión */}
            {user.role === "inversor" && (
              <div className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,154,0,0.2)" }}>
                <h3 className="font-bold text-white mb-3 text-sm">¿Querés invertir?</h3>
                {canInvest ? (
                  <>
                    <Link href={`/inversion/${asset.id}`}
                          className="block w-full text-center py-3 rounded-lg font-semibold text-sm mb-3"
                          style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
                      Iniciar intención de inversión →
                    </Link>
                    <p className="text-xs text-center" style={{ color: "#6B6358" }}>
                      Los fondos quedan retenidos hasta la aprobación de Mercado Token.
                    </p>
                  </>
                ) : user.kycStatus !== "aprobado" ? (
                  <div>
                    <p className="text-xs mb-3" style={{ color: "#A1A1AA" }}>
                      Para invertir necesitás completar y aprobar la verificación KYC.
                    </p>
                    <Link href="/perfil"
                          className="block w-full text-center py-2.5 rounded-lg font-semibold text-sm"
                          style={{ border: "1px solid rgba(245,158,11,0.4)", color: "#F59E0B", textDecoration: "none" }}>
                      Completar KYC →
                    </Link>
                  </div>
                ) : null}
              </div>
            )}

            {user.role === "emisor" && (
              <div className="p-4 rounded-xl text-xs text-center" style={{ color: "#6B6358", border: "1px solid rgba(255,255,255,0.07)", background: "#111" }}>
                Las cuentas emisoras no pueden invertir en activos de otros emisores.
              </div>
            )}

          </div>
        </div>

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
