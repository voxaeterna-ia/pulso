"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAssetsForAdmin, getAllIntentions } from "@/lib/services/firestore";
import { Asset, InvestmentIntention } from "@/types";
import { ASSET_STATUS_LABELS, EscrowService } from "@/lib/services/escrow";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [intentions, setIntentions] = useState<InvestmentIntention[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && user.role !== "admin") { router.push("/dashboard"); return; }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getAssetsForAdmin().catch(() => []),
      getAllIntentions().catch(() => []),
    ]).then(([a, i]) => { setAssets(a); setIntentions(i); setDataLoading(false); });
  }, [user]);

  if (loading || !user) return <Spinner />;

  const submitted  = assets.filter(a => a.status === "submitted");
  const inReview   = assets.filter(a => a.status === "under_review");
  const listed     = assets.filter(a => a.status === "listed");
  const pendingOps = intentions.filter(i => ["pending_review", "funds_held"].includes(i.status));

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-6xl mx-auto">

        <div className="mb-8 mt-6">
          <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
          <p className="mt-1 text-sm" style={{ color: "#A1A1AA" }}>Mercado Token · Control interno</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Para revisar",   value: submitted.length,  color: "#F59E0B", href: "/admin/activos" },
            { label: "En revisión",    value: inReview.length,   color: "#3B82F6", href: "/admin/activos" },
            { label: "Publicados",     value: listed.length,     color: "#10B981", href: "/marketplace"  },
            { label: "Ops pendientes", value: pendingOps.length, color: "#8B5CF6", href: "/admin/inversiones" },
          ].map(s => (
            <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
              <div className="p-5 rounded-xl transition hover:border-orange-500/30"
                   style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-xs mb-1 uppercase tracking-wider" style={{ color: "#6B6358" }}>{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Acceso rápido */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: "🔍", label: "Validar activos",  href: "/admin/activos",     desc: "Revisar y aprobar activos enviados" },
            { icon: "💼", label: "Operaciones",      href: "/admin/inversiones", desc: "Gestionar escrow y transacciones" },
            { icon: "🌐", label: "Marketplace",      href: "/marketplace",       desc: "Ver activos publicados" },
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

        {/* Activos pendientes de revisión */}
        {submitted.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-lg">Activos esperando revisión</h2>
              <Link href="/admin/activos" className="text-sm" style={{ color: "#FF9A00" }}>Ver todos →</Link>
            </div>
            <div className="space-y-3">
              {submitted.slice(0, 3).map(asset => (
                <Link key={asset.id} href={`/admin/activos/${asset.id}`}
                      className="flex items-center justify-between p-4 rounded-xl transition hover:border-yellow-500/30"
                      style={{ background: "#111", border: "1px solid rgba(245,158,11,0.2)", textDecoration: "none" }}>
                  <div>
                    <div className="font-semibold text-white text-sm">{asset.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>
                      {asset.issuerName} · {asset.city}, {asset.country}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold ml-3 flex-shrink-0"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                    Pendiente
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Operaciones pendientes */}
        {pendingOps.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-lg">Operaciones de escrow pendientes</h2>
              <Link href="/admin/inversiones" className="text-sm" style={{ color: "#FF9A00" }}>Ver todas →</Link>
            </div>
            <div className="space-y-3">
              {pendingOps.slice(0, 3).map(inv => {
                const color = EscrowService.getStatusColor(inv.status);
                return (
                  <Link key={inv.id} href={`/admin/inversiones/${inv.id}`}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}>
                    <div>
                      <div className="font-semibold text-white text-sm">{inv.assetName}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>
                        {inv.investorName} · USD {inv.amountUSD.toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold ml-3 flex-shrink-0"
                          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                      {EscrowService.getStatusLabel(inv.status)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {!dataLoading && submitted.length === 0 && pendingOps.length === 0 && (
          <div className="text-center py-12 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-4xl mb-3">✅</div>
            <div className="font-semibold text-white">Todo al día</div>
            <div className="text-sm mt-1" style={{ color: "#A1A1AA" }}>No hay activos ni operaciones pendientes de revisión.</div>
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
