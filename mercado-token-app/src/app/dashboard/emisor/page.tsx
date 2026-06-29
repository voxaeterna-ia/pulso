"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAssetsByIssuer } from "@/lib/services/firestore";
import { Asset } from "@/types";
import { ASSET_STATUS_LABELS } from "@/lib/services/escrow";

export default function EmisorDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
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

  const draft    = assets.filter(a => a.status === "draft");
  const review   = assets.filter(a => ["submitted", "under_review"].includes(a.status));
  const listed   = assets.filter(a => a.status === "listed");
  const changes  = assets.filter(a => a.status === "needs_changes");

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8 mt-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Hola, {user.name.split(" ")[0]} 👋</h1>
            <p className="mt-1 text-sm" style={{ color: "#A1A1AA" }}>Panel Emisor · Mercado Token</p>
          </div>
          <Link href="/emisor/nuevo-activo"
                className="px-5 py-2.5 rounded-lg font-semibold text-sm"
                style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
            + Cargar activo
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Borradores",    value: draft.length,   color: "#6B7280" },
            { label: "En revisión",   value: review.length,  color: "#F59E0B" },
            { label: "Publicados",    value: listed.length,  color: "#10B981" },
            { label: "Con cambios",   value: changes.length, color: "#EF4444" },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-xs mb-1 uppercase tracking-wider" style={{ color: "#6B6358" }}>{s.label}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Alerta cambios requeridos */}
        {changes.length > 0 && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
               style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <span>⚠️</span>
            <div>
              <div className="font-semibold text-white text-sm">Tenés {changes.length} activo{changes.length > 1 ? "s" : ""} con observaciones pendientes</div>
              <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>Revisá las observaciones del equipo de Mercado Token y actualizá la información.</div>
            </div>
            <Link href="/emisor/activos" className="ml-auto text-sm px-3 py-1.5 rounded-lg flex-shrink-0"
                  style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#EF4444", textDecoration: "none" }}>
              Ver →
            </Link>
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: "📤", label: "Mis activos",    href: "/emisor/activos",       desc: "Gestionar activos cargados" },
            { icon: "➕", label: "Nuevo activo",   href: "/emisor/nuevo-activo",  desc: "Cargar un nuevo activo" },
            { icon: "👤", label: "Mi perfil",      href: "/perfil",               desc: "Datos y verificación" },
          ].map(a => (
            <Link key={a.href} href={a.href}
                  className="p-5 rounded-xl transition hover:border-orange-500/40"
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}>
              <div className="text-2xl mb-3">{a.icon}</div>
              <div className="font-semibold text-white text-sm mb-1">{a.label}</div>
              <div className="text-xs" style={{ color: "#6B6358" }}>{a.desc}</div>
            </Link>
          ))}
        </div>

        {/* Lista de activos recientes */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-lg">Mis activos</h2>
          <Link href="/emisor/activos" className="text-sm" style={{ color: "#FF9A00" }}>Ver todos →</Link>
        </div>

        {dataLoading ? (
          <div className="text-center py-8" style={{ color: "#6B6358" }}>Cargando...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-4xl mb-3">📦</div>
            <div className="font-semibold text-white mb-2">Todavía no cargaste activos</div>
            <div className="text-sm mb-4" style={{ color: "#A1A1AA" }}>Comenzá cargando tu primer activo para revisión.</div>
            <Link href="/emisor/nuevo-activo"
                  className="inline-block px-5 py-2.5 rounded-lg font-semibold text-sm"
                  style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
              Cargar primer activo →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.slice(0, 5).map(asset => {
              const st = ASSET_STATUS_LABELS[asset.status] ?? { label: asset.status, color: "#6B7280" };
              return (
                <Link key={asset.id} href={`/emisor/activos/${asset.id}`}
                      className="flex items-center justify-between p-4 rounded-xl transition hover:border-orange-500/30"
                      style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}>
                  <div>
                    <div className="font-semibold text-white text-sm">{asset.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>
                      {asset.city}, {asset.country} · USD {asset.tokenizationAmount?.toLocaleString()}
                    </div>
                    {asset.adminReviewNote && asset.status === "needs_changes" && (
                      <div className="text-xs mt-1 px-2 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                        Obs: {asset.adminReviewNote}
                      </div>
                    )}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold ml-3 flex-shrink-0"
                        style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}44` }}>
                    {st.label}
                  </span>
                </Link>
              );
            })}
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
