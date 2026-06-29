"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAssetsForAdmin, updateAsset, addAuditLog } from "@/lib/services/firestore";
import { Asset, AssetStatus } from "@/types";
import { ASSET_STATUS_LABELS } from "@/lib/services/escrow";
import { SECTORS } from "@/lib/constants";

export default function AdminActivosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState<AssetStatus | "all">("all");
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [action, setAction] = useState<AssetStatus | "">("");
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && user.role !== "admin") { router.push("/dashboard"); return; }
  }, [user, loading, router]);

  async function load() {
    getAssetsForAdmin().catch(() => []).then(a => { setAssets(a); setDataLoading(false); });
  }

  useEffect(() => { if (user) load(); }, [user]);

  if (loading || !user) return <Spinner />;

  const filtered = filter === "all" ? assets : assets.filter(a => a.status === filter);

  async function handleAction() {
    if (!selectedAsset || !action || !user) return;
    setProcessing(true);
    try {
      await updateAsset(selectedAsset.id, {
        status: action as AssetStatus,
        adminReviewNote: note || undefined,
      });
      await addAuditLog({
        actorId: user.id,
        actorRole: "admin",
        action: `asset_${action}`,
        entityType: "asset",
        entityId: selectedAsset.id,
        details: { note, previousStatus: selectedAsset.status },
      });
      setSelectedAsset(null);
      setAction("");
      setNote("");
      await load();
    } finally {
      setProcessing(false);
    }
  }

  const ACTIONS: { value: AssetStatus; label: string; color: string }[] = [
    { value: "under_review",  label: "Marcar en revisión",    color: "#3B82F6" },
    { value: "approved",      label: "Aprobar",               color: "#10B981" },
    { value: "listed",        label: "Publicar en marketplace", color: "#10B981" },
    { value: "needs_changes", label: "Pedir cambios",         color: "#F59E0B" },
    { value: "rejected",      label: "Rechazar",              color: "#EF4444" },
    { value: "paused",        label: "Pausar",                color: "#6B7280" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-6xl mx-auto">

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white">Validación de activos</h1>
          <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>Panel de administración · Mercado Token</p>
        </div>

        {/* Contadores */}
        <div className="flex gap-3 flex-wrap mb-6">
          {[
            { status: "all",          label: "Todos",          count: assets.length },
            { status: "submitted",    label: "Enviados",       count: assets.filter(a => a.status === "submitted").length },
            { status: "under_review", label: "En revisión",    count: assets.filter(a => a.status === "under_review").length },
            { status: "listed",       label: "Publicados",     count: assets.filter(a => a.status === "listed").length },
            { status: "needs_changes",label: "Con cambios",    count: assets.filter(a => a.status === "needs_changes").length },
            { status: "rejected",     label: "Rechazados",     count: assets.filter(a => a.status === "rejected").length },
          ].map(f => (
            <button key={f.status} onClick={() => setFilter(f.status as AssetStatus | "all")}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5"
                    style={{
                      background: filter === f.status ? "rgba(255,154,0,0.15)" : "rgba(255,255,255,0.04)",
                      color: filter === f.status ? "#FF9A00" : "#6B6358",
                      border: `1px solid ${filter === f.status ? "rgba(255,154,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}>
              {f.label}
              <span className="px-1.5 py-0.5 rounded-full text-xs"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#A1A1AA" }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="text-center py-16" style={{ color: "#6B6358" }}>Cargando activos...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-3xl mb-3">✅</div>
            <div className="font-semibold text-white">Sin activos en este estado</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(asset => {
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
                          Emisor: {asset.issuerName} · {asset.city}, {asset.country}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#6B6358" }}>
                          USD {(asset.tokenizationAmount ?? 0).toLocaleString()} · Token USD {asset.tokenPrice}
                          {asset.expectedReturn && ` · ${asset.expectedReturn} est.`}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                          style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}44` }}>
                      {st.label}
                    </span>
                  </div>

                  {asset.shortDescription && (
                    <div className="mt-3 text-xs" style={{ color: "#A1A1AA" }}>{asset.shortDescription}</div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <Link href={`/admin/activos/${asset.id}`} className="text-xs" style={{ color: "#A1A1AA", textDecoration: "none" }}>
                      Ver detalle completo →
                    </Link>
                    <button onClick={() => { setSelectedAsset(asset); setAction(""); setNote(""); }}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(255,154,0,0.12)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.25)" }}>
                      Tomar acción
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de acción */}
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
               style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="font-bold text-white text-lg mb-1">Tomar acción</h3>
              <p className="text-sm mb-5" style={{ color: "#A1A1AA" }}>{selectedAsset.name}</p>

              <div className="grid grid-cols-2 gap-2 mb-5">
                {ACTIONS.map(a => (
                  <button key={a.value} onClick={() => setAction(a.value)}
                          className="p-2.5 rounded-lg text-xs font-semibold text-left transition"
                          style={{
                            background: action === a.value ? `${a.color}22` : "rgba(255,255,255,0.03)",
                            border: `1px solid ${action === a.value ? `${a.color}66` : "rgba(255,255,255,0.08)"}`,
                            color: action === a.value ? a.color : "#6B6358",
                          }}>
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="block text-xs mb-2" style={{ color: "#A1A1AA" }}>Observación (opcional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                          placeholder="Notas para el emisor o registro interno..."
                          className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none resize-none"
                          style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedAsset(null)}
                        className="flex-1 py-2.5 rounded-lg text-sm"
                        style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#6B6358" }}>
                  Cancelar
                </button>
                <button onClick={handleAction} disabled={!action || processing}
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition"
                        style={{
                          background: action ? "linear-gradient(135deg, #FF9A00, #D4AF37)" : "#222",
                          color: action ? "#000" : "#6B6358",
                        }}>
                  {processing ? "Guardando..." : "Confirmar acción"}
                </button>
              </div>
            </div>
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
