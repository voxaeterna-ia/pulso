"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { MOCK_ASSETS, SECTORS } from "@/lib/constants";

const KYC_LABELS = {
  pendiente:   { label: "KYC Pendiente",   color: "#F59E0B" },
  en_revision: { label: "KYC En revisión", color: "#3B82F6" },
  aprobado:    { label: "KYC Aprobado",    color: "#10B981" },
  rechazado:   { label: "KYC Rechazado",   color: "#EF4444" },
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--copper)", borderTopColor: "transparent" }} />
    </div>
  );

  const kyc = KYC_LABELS[user.kycStatus];
  const activeAssets = MOCK_ASSETS.filter(a => a.status === "activo").slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Hola, {user.name.split(" ")[0]} 👋</h1>
            <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }} className="mt-1">
              {user.role === "inversor" ? "Panel de inversor" : "Panel de emisor"} · Mercado Token
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: `${kyc.color}22`, color: kyc.color, border: `1px solid ${kyc.color}44` }}>
            {kyc.label}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Balance MKT",     value: `${user.mktBalance.toLocaleString()} MKT`, color: "var(--gold-light)" },
            { label: "Activos activos",  value: activeAssets.length.toString(),            color: "#10B981" },
            { label: "Sectores",         value: SECTORS.length.toString(),                 color: "var(--copper)" },
            { label: "Fase actual",      value: "MVP",                                     color: "#A1A1AA" },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-xs mb-1" style={{ color: "#6B6358", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* KYC Banner */}
        {user.kycStatus === "pendiente" && (
          <div className="mb-8 p-5 rounded-xl flex items-center justify-between gap-4"
               style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <div>
              <div className="font-semibold text-white mb-1">Completá tu verificación de identidad</div>
              <div className="text-sm" style={{ color: "#A1A1AA" }}>Para invertir necesitás completar el proceso KYC. Solo toma unos minutos.</div>
            </div>
            <Link href="/perfil" className="px-5 py-2.5 rounded-lg font-semibold text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
              Verificar ahora →
            </Link>
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: "🏪", label: "Marketplace",    href: "/marketplace",   desc: "Ver activos disponibles" },
            { icon: "👛", label: "Mi Wallet",      href: "/wallet",        desc: "Balance y transacciones" },
            { icon: user.role === "emisor" ? "📤" : "📊", label: user.role === "emisor" ? "Panel Emisor" : "Mi Portafolio", href: user.role === "emisor" ? "/emisor" : "/marketplace", desc: user.role === "emisor" ? "Gestionar activos" : "Ver inversiones" },
          ].map(a => (
            <Link key={a.href} href={a.href}
                  className="p-5 rounded-xl transition hover:border-orange-500/40 group"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}>
              <div className="text-2xl mb-3">{a.icon}</div>
              <div className="font-semibold text-white mb-1">{a.label}</div>
              <div className="text-xs" style={{ color: "#6B6358" }}>{a.desc}</div>
            </Link>
          ))}
        </div>

        {/* Activos destacados */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-white text-lg">Activos destacados</h2>
          <Link href="/marketplace" className="text-sm" style={{ color: "var(--copper)" }}>Ver todos →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {activeAssets.map(asset => {
            const sector = SECTORS.find(s => s.id === asset.sector);
            const pct = Math.round(((asset.tokensTotal - asset.tokensAvailable) / asset.tokensTotal) * 100);
            return (
              <div key={asset.id} className="p-5 rounded-xl hover:border-orange-500/30 transition"
                   style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{sector?.icon}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(255,154,0,0.12)", color: "var(--copper)", border: "1px solid rgba(255,154,0,0.25)" }}>
                    {sector?.tag}
                  </span>
                </div>
                <div className="font-bold text-white mb-1">{asset.name}</div>
                <div className="text-xs mb-3" style={{ color: "#6B6358" }}>{asset.location}</div>
                <div className="flex justify-between text-xs mb-2" style={{ color: "#A1A1AA" }}>
                  <span>Token: <strong className="text-white">USD {asset.tokenPrice}</strong></span>
                  <span style={{ color: "#10B981" }}>{asset.expectedReturn} est.</span>
                </div>
                <div className="w-full h-1.5 rounded-full mb-1" style={{ background: "#222" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FF9A00, #D4AF37)" }} />
                </div>
                <div className="text-xs" style={{ color: "#6B6358" }}>{pct}% colocado</div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
