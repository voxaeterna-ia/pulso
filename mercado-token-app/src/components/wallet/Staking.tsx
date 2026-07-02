"use client";

export default function Staking() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center py-10 mb-6">
        <div className="text-6xl mb-4">🔒</div>
        <div className="text-xl font-bold text-white mb-2">Staking MKT</div>
        <div className="text-sm text-center mb-6 max-w-xs" style={{ color: "#A1A1AA" }}>
          Bloqueá tus tokens MKT por períodos determinados y ganá recompensas mensuales dentro del ecosistema.
        </div>
        <span className="px-4 py-2 rounded-full text-sm font-bold"
              style={{ background: "rgba(56,189,248,0.1)", color: "#38BDF8", border: "1px solid rgba(56,189,248,0.3)" }}>
          Próximamente
        </span>
      </div>

      {/* Planes de staking preparados */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {[
          { periodo: "30 días",  apy: "6% APY",  min: "500 MKT",  icon: "🌱" },
          { periodo: "90 días",  apy: "10% APY", min: "1.000 MKT", icon: "🌿" },
          { periodo: "180 días", apy: "15% APY", min: "5.000 MKT", icon: "🌳" },
          { periodo: "365 días", apy: "22% APY", min: "10.000 MKT", icon: "💎" },
        ].map(plan => (
          <div key={plan.periodo} className="flex items-center justify-between p-4 rounded-xl opacity-60"
               style={{ background: "#111111", border: "1px solid rgba(56,189,248,0.15)" }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{plan.icon}</span>
              <div>
                <div className="font-semibold text-white text-sm">{plan.periodo}</div>
                <div className="text-xs" style={{ color: "#6B6358" }}>Mínimo {plan.min}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold" style={{ color: "#38BDF8" }}>{plan.apy}</div>
              <div className="text-xs mt-0.5" style={{ color: "#52525B" }}>Bloqueado</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl text-xs text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", color: "#52525B" }}>
        Arquitectura preparada para integración con smart contracts de staking en blockchain. Los planes y APYs son preliminares y pueden variar.
      </div>
    </div>
  );
}
