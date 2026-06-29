"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getListedAssets } from "@/lib/services/firestore";
import { Asset, AssetType } from "@/types";
import { SECTORS } from "@/lib/constants";

export default function MarketplacePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState<AssetType | "all">("all");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    getListedAssets().catch(() => []).then(a => { setAssets(a); setDataLoading(false); });
  }, []);

  if (loading || !user) return <Spinner />;

  const filtered = filter === "all" ? assets : assets.filter(a => a.assetType === filter);

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-6xl mx-auto">

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          <p className="mt-1 text-sm" style={{ color: "#A1A1AA" }}>Activos tokenizados validados por Mercado Token</p>
        </div>

        {/* Filtros por sector */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button onClick={() => setFilter("all")}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  style={{
                    background: filter === "all" ? "rgba(255,154,0,0.15)" : "rgba(255,255,255,0.04)",
                    color: filter === "all" ? "#FF9A00" : "#6B6358",
                    border: `1px solid ${filter === "all" ? "rgba(255,154,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                  }}>
            Todos
          </button>
          {SECTORS.map(s => (
            <button key={s.id} onClick={() => setFilter(s.id as AssetType)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
                    style={{
                      background: filter === s.id ? "rgba(255,154,0,0.15)" : "rgba(255,255,255,0.04)",
                      color: filter === s.id ? "#FF9A00" : "#6B6358",
                      border: `1px solid ${filter === s.id ? "rgba(255,154,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}>
              {s.icon} {s.tag}
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="text-center py-16" style={{ color: "#6B6358" }}>Cargando activos...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🏪</div>
            <div className="font-semibold text-white mb-1">No hay activos disponibles</div>
            <div className="text-sm" style={{ color: "#A1A1AA" }}>
              {filter !== "all" ? "Probá con otro sector." : "Los activos validados aparecerán aquí pronto."}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(asset => {
              const sector = SECTORS.find(s => s.id === asset.assetType);
              const pct = asset.fundedPercent ?? 0;
              return (
                <div key={asset.id} className="rounded-xl overflow-hidden transition hover:border-orange-500/30"
                     style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {/* Image placeholder */}
                  <div className="h-36 flex items-center justify-center"
                       style={{ background: "linear-gradient(135deg, #1a1a1a, #111)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-5xl">{sector?.icon ?? "📦"}</span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(255,154,0,0.12)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.25)" }}>
                        {sector?.tag ?? asset.assetType}
                      </span>
                    </div>

                    <div className="font-bold text-white text-base mb-1">{asset.name}</div>
                    <div className="text-xs mb-3" style={{ color: "#6B6358" }}>{asset.city}, {asset.country}</div>
                    <div className="text-xs mb-4 line-clamp-2" style={{ color: "#A1A1AA" }}>{asset.shortDescription}</div>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                      <div className="p-2 rounded-lg" style={{ background: "#0A0A0A" }}>
                        <div style={{ color: "#6B6358" }}>Token</div>
                        <div className="font-bold text-white">USD {asset.tokenPrice}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: "#0A0A0A" }}>
                        <div style={{ color: "#6B6358" }}>Retorno est.</div>
                        <div className="font-bold" style={{ color: "#10B981" }}>{asset.expectedReturn ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: "#0A0A0A" }}>
                        <div style={{ color: "#6B6358" }}>Monto total</div>
                        <div className="font-bold text-white">USD {(asset.tokenizationAmount ?? 0).toLocaleString()}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: "#0A0A0A" }}>
                        <div style={{ color: "#6B6358" }}>Horizonte</div>
                        <div className="font-bold text-white">{asset.projectHorizon ?? "—"}</div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-1 flex justify-between text-xs" style={{ color: "#6B6358" }}>
                      <span>{pct}% financiado</span>
                      <span>{asset.tokensAvailable ?? 0} tokens disp.</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full mb-4" style={{ background: "#222" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FF9A00, #D4AF37)" }} />
                    </div>

                    <Link href={`/marketplace/${asset.id}`}
                          className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold transition"
                          style={{ background: "rgba(255,154,0,0.1)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.25)", textDecoration: "none" }}>
                      Ver detalle →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 p-4 rounded-xl text-xs text-center" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.05)", color: "#52525B" }}>
          Mercado Token se encuentra en etapa de desarrollo conceptual. La información presentada no constituye oferta pública de valores ni asesoramiento financiero.
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
