"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getListedAssets, getIntentionsByInvestor, getNotificationsByUser } from "@/lib/services/firestore";
import { Asset, InvestmentIntention, Notification } from "@/types";
import { EscrowService, ASSET_STATUS_LABELS } from "@/lib/services/escrow";
import { SECTORS } from "@/lib/constants";

const KYC_LABELS = {
  pendiente:   { label: "KYC Pendiente",   color: "#F59E0B" },
  en_revision: { label: "KYC En revisión", color: "#3B82F6" },
  aprobado:    { label: "KYC Aprobado",    color: "#10B981" },
  rechazado:   { label: "KYC Rechazado",   color: "#EF4444" },
};

export default function InversorDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [intentions, setIntentions] = useState<InvestmentIntention[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && user.role !== "inversor") { router.push("/dashboard"); return; }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getListedAssets().catch(() => []),
      getIntentionsByInvestor(user.id).catch(() => []),
      getNotificationsByUser(user.id).catch(() => []),
    ]).then(([a, i, n]) => {
      setAssets(a.slice(0, 3));
      setIntentions(i);
      setNotifications(n.filter(x => !x.read).slice(0, 3));
      setDataLoading(false);
    });
  }, [user]);

  if (loading || !user) return <Spinner />;

  const kyc = KYC_LABELS[user.kycStatus];
  const pending = intentions.filter(i => !["completed", "cancelled", "refunded"].includes(i.status));
  const completed = intentions.filter(i => i.status === "completed");

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Hola, {user.name.split(" ")[0]} 👋</h1>
            <p className="mt-1 text-sm" style={{ color: "#A1A1AA" }}>Panel Inversor · Mercado Token</p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: `${kyc.color}22`, color: kyc.color, border: `1px solid ${kyc.color}44` }}>
            {kyc.label}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Balance MKT",         value: `${user.mktBalance.toLocaleString()} MKT`, color: "#D4AF37" },
            { label: "Inversiones activas",  value: pending.length.toString(),                 color: "#10B981" },
            { label: "Completadas",          value: completed.length.toString(),               color: "#FF9A00" },
            { label: "Notificaciones",       value: notifications.length.toString(),           color: "#3B82F6" },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-xs mb-1 uppercase tracking-wider" style={{ color: "#6B6358" }}>{s.label}</div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* KYC Banner */}
        {user.kycStatus === "pendiente" && (
          <div className="mb-8 p-5 rounded-xl flex items-center justify-between gap-4"
               style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <div>
              <div className="font-semibold text-white mb-1">Completá tu verificación KYC</div>
              <div className="text-sm" style={{ color: "#A1A1AA" }}>Para invertir necesitás completar el proceso KYC.</div>
            </div>
            <Link href="/perfil" className="px-5 py-2.5 rounded-lg font-semibold text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
              Verificar →
            </Link>
          </div>
        )}

        {/* Notificaciones */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-white mb-3 text-sm uppercase tracking-wider" style={{ color: "#6B6358" }}>Notificaciones</h2>
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className="p-4 rounded-xl flex items-start gap-3"
                     style={{ background: "#111", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <span style={{ color: "#3B82F6" }}>🔔</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{n.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>{n.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "🏪", label: "Marketplace",       href: "/marketplace",  desc: "Explorar activos" },
            { icon: "📊", label: "Mis inversiones",   href: "/inversiones",  desc: "Ver operaciones" },
            { icon: "👛", label: "Wallet",             href: "/wallet",       desc: "Balance y movimientos" },
            { icon: "👤", label: "Mi perfil / KYC",   href: "/perfil",       desc: "Verificación y datos" },
          ].map(a => (
            <Link key={a.href} href={a.href}
                  className="p-5 rounded-xl transition hover:border-orange-500/40 group"
                  style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}>
              <div className="text-2xl mb-3">{a.icon}</div>
              <div className="font-semibold text-white text-sm mb-1">{a.label}</div>
              <div className="text-xs" style={{ color: "#6B6358" }}>{a.desc}</div>
            </Link>
          ))}
        </div>

        {/* Inversiones pendientes */}
        {pending.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-lg">Inversiones en curso</h2>
              <Link href="/inversiones" className="text-sm" style={{ color: "#FF9A00" }}>Ver todas →</Link>
            </div>
            <div className="space-y-3">
              {pending.slice(0, 3).map(inv => {
                const color = EscrowService.getStatusColor(inv.status);
                return (
                  <div key={inv.id} className="p-4 rounded-xl flex items-center justify-between"
                       style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div>
                      <div className="font-semibold text-white text-sm">{inv.assetName}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>USD {inv.amountUSD.toLocaleString()}</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                      {EscrowService.getStatusLabel(inv.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activos destacados del marketplace */}
        {!dataLoading && assets.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-lg">Activos disponibles</h2>
              <Link href="/marketplace" className="text-sm" style={{ color: "#FF9A00" }}>Ver marketplace →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {assets.map(asset => {
                const sector = SECTORS.find(s => s.id === asset.assetType);
                const pct = asset.fundedPercent ?? Math.round(((asset.tokensTotal - asset.tokensAvailable) / asset.tokensTotal) * 100);
                return (
                  <Link key={asset.id} href={`/marketplace/${asset.id}`} style={{ textDecoration: "none" }}>
                    <div className="p-5 rounded-xl hover:border-orange-500/30 transition h-full"
                         style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{sector?.icon ?? "📦"}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(255,154,0,0.12)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.25)" }}>
                          {sector?.tag ?? asset.assetType}
                        </span>
                      </div>
                      <div className="font-bold text-white mb-1">{asset.name}</div>
                      <div className="text-xs mb-3" style={{ color: "#6B6358" }}>{asset.city}, {asset.country}</div>
                      <div className="flex justify-between text-xs mb-2" style={{ color: "#A1A1AA" }}>
                        <span>Token: <strong className="text-white">USD {asset.tokenPrice}</strong></span>
                        {asset.expectedReturn && <span style={{ color: "#10B981" }}>{asset.expectedReturn} est.</span>}
                      </div>
                      <div className="w-full h-1.5 rounded-full mb-1" style={{ background: "#222" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FF9A00, #D4AF37)" }} />
                      </div>
                      <div className="text-xs" style={{ color: "#6B6358" }}>{pct}% financiado</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {!dataLoading && assets.length === 0 && (
          <div className="text-center py-12" style={{ color: "#6B6358" }}>
            <div className="text-4xl mb-3">🏪</div>
            <div className="font-semibold text-white mb-1">No hay activos disponibles aún</div>
            <div className="text-sm">Los activos aprobados aparecerán aquí.</div>
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
