"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAssetsByIssuer } from "@/lib/services/firestore";
import { Asset } from "@/types";
import { ASSET_STATUS_LABELS } from "@/lib/services/escrow";
import { SECTORS } from "@/lib/constants";

function EmisorActivosInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const submitted = searchParams.get("submitted") === "1";
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && user.role !== "emisor") { router.push("/dashboard"); return; }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getAssetsByIssuer(user.id).catch(() => []).then(a => { setAssets(a); setDataLoading(false); });
  }, [user]);

  if (loading || !user) return <Spinner />;

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-5xl mx-auto">

        <div className="flex items-center justify-between mt-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Mis activos</h1>
            <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>Activos cargados por vos para tokenización</p>
          </div>
          <Link href="/emisor/nuevo-activo"
                className="px-5 py-2.5 rounded-lg font-semibold text-sm"
                style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
            + Nuevo activo
          </Link>
        </div>

        {submitted && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
               style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <span>✅</span>
            <div>
              <div className="font-semibold text-white text-sm">Activo enviado a revisión</div>
              <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>El equipo de Mercado Token lo revisará pronto.</div>
            </div>
          </div>
        )}

        {dataLoading ? (
          <div className="text-center py-16" style={{ color: "#6B6358" }}>Cargando activos...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-4xl mb-3">📦</div>
            <div className="font-semibold text-white mb-2">Todavía no cargaste activos</div>
            <Link href="/emisor/nuevo-activo"
                  className="inline-block px-5 py-2.5 rounded-lg font-semibold text-sm mt-2"
                  style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
              Cargar primer activo →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assets.map(asset => {
              const st = ASSET_STATUS_LABELS[asset.status] ?? { label: asset.status, color: "#6B7280" };
              const sector = SECTORS.find(s => s.id === asset.assetType);
              return (
                <div key={asset.id} className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{sector?.icon ?? "📦"}</span>
                      <div>
                        <div className="font-bold text-white">{asset.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>
                          {asset.city}, {asset.country} · {sector?.name ?? asset.assetType}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#6B6358" }}>
                          USD {(asset.tokenizationAmount ?? 0).toLocaleString()} · Token USD {asset.tokenPrice}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                          style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}44` }}>
                      {st.label}
                    </span>
                  </div>

                  {asset.adminReviewNote && (
                    <div className="mt-3 p-3 rounded-lg text-xs"
                         style={{ background: asset.status === "needs_changes" ? "rgba(239,68,68,0.08)" : "rgba(59,130,246,0.08)",
                                  border: `1px solid ${asset.status === "needs_changes" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)"}`,
                                  color: asset.status === "needs_changes" ? "#EF4444" : "#3B82F6" }}>
                      <strong>Observación:</strong> {asset.adminReviewNote}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-3">
                      {asset.status === "listed" && (
                        <Link href={`/marketplace/${asset.id}`} className="text-xs"
                              style={{ color: "#10B981", textDecoration: "none" }}>
                          Ver en marketplace →
                        </Link>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {["draft", "needs_changes"].includes(asset.status) && (
                        <Link href={`/emisor/activos/${asset.id}/editar`}
                              className="px-3 py-1.5 rounded-lg text-xs"
                              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A1A1AA", textDecoration: "none" }}>
                          Editar
                        </Link>
                      )}
                      <Link href={`/emisor/activos/${asset.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs"
                            style={{ border: "1px solid rgba(255,154,0,0.3)", color: "#FF9A00", textDecoration: "none" }}>
                        Ver detalle →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}

export default function EmisorActivosPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <EmisorActivosInner />
    </Suspense>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#FF9A00", borderTopColor: "transparent" }} />
    </div>
  );
}
