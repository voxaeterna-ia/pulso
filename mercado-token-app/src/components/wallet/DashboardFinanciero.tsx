"use client";
import { MKT_PRICE_USD, MOCK_PORTFOLIO, MOCK_DIVIDENDS, MOCK_REWARDS } from "./wallet-data";
import { User } from "@/types";

interface Props { user: User; }

export default function DashboardFinanciero({ user }: Props) {
  const mktUSD = user.mktBalance * MKT_PRICE_USD;
  const portfolioValue = MOCK_PORTFOLIO.reduce((s, a) => s + a.currentValue, 0);
  const totalPatrimonio = mktUSD + portfolioValue;
  const totalGanancia = MOCK_PORTFOLIO.reduce((s, a) => s + (a.currentValue - a.purchaseValue), 0);
  const dividendosPagados = MOCK_DIVIDENDS.filter(d => d.status === "pagado").reduce((s, d) => s + d.amount, 0);
  const dividendosPendientes = MOCK_DIVIDENDS.filter(d => d.status !== "pagado").reduce((s, d) => s + d.amount, 0);
  const totalRewards = MOCK_REWARDS.reduce((s, r) => s + r.amount, 0);
  const rentabilidadPct = portfolioValue > 0
    ? ((totalGanancia / MOCK_PORTFOLIO.reduce((s, a) => s + a.purchaseValue, 0)) * 100).toFixed(1)
    : "0.0";

  const stats = [
    { label: "Capital disponible",   value: `${user.mktBalance.toLocaleString()} MKT`, sub: `≈ USD ${mktUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "#D4AF37", icon: "💰" },
    { label: "Inversiones activas",  value: `USD ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: `${MOCK_PORTFOLIO.length} activos`, color: "#FF9A00", icon: "📊" },
    { label: "Rentabilidad",         value: `+${rentabilidadPct}%`, sub: `+USD ${totalGanancia.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: "#10B981", icon: "📈" },
    { label: "Dividendos cobrados",  value: `${dividendosPagados} MKT`, sub: `≈ USD ${dividendosPagados.toFixed(2)}`, color: "#A78BFA", icon: "💸" },
    { label: "Próximos dividendos",  value: `${dividendosPendientes} MKT`, sub: "programados", color: "#38BDF8", icon: "📅" },
    { label: "Rewards acumulados",   value: `${totalRewards} MKT`, sub: "en el ecosistema", color: "#F59E0B", icon: "🎁" },
  ];

  return (
    <div>
      {/* Patrimonio total */}
      <div className="p-6 rounded-2xl mb-6 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #1A1200 0%, #111111 60%, #0D1A0A 100%)", border: "1px solid rgba(212,175,55,0.35)" }}>
        <div className="absolute inset-0 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(ellipse at 85% 50%, rgba(255,154,0,0.08) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-xs mb-2 tracking-widest uppercase" style={{ color: "#6B6358" }}>Patrimonio Total</div>
          <div className="text-4xl font-bold mb-1" style={{ color: "#D4AF37" }}>
            USD {totalPatrimonio.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: "#10B981" }}>▲ {rentabilidadPct}%</span>
            <span style={{ color: "#6B6358" }}>rentabilidad acumulada</span>
          </div>
        </div>
      </div>

      {/* Grid de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="p-4 rounded-xl"
               style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <span className="text-xs" style={{ color: "#6B6358" }}>{s.label}</span>
            </div>
            <div className="font-bold text-base" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#52525B" }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
