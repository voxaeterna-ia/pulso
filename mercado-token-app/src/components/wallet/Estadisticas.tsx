"use client";
import { MOCK_PORTFOLIO } from "./wallet-data";

export default function Estadisticas() {
  const total = MOCK_PORTFOLIO.reduce((s, a) => s + a.currentValue, 0);

  const byType = MOCK_PORTFOLIO.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + a.currentValue;
    return acc;
  }, {});

  const distribution = Object.entries(byType).map(([type, value]) => ({
    type,
    value,
    pct: total > 0 ? Math.round((value / total) * 100) : 0,
  }));

  const riskProfile = [
    { label: "Bajo",  pct: 30, color: "#10B981" },
    { label: "Medio", pct: 55, color: "#F59E0B" },
    { label: "Alto",  pct: 15, color: "#EF4444" },
  ];

  return (
    <div>
      {/* Distribución por categoría */}
      <div className="p-5 rounded-xl mb-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="font-bold text-white mb-4 text-sm">Distribución por categoría</div>
        {distribution.length > 0 ? (
          <div className="flex flex-col gap-3">
            {distribution.map(d => (
              <div key={d.type}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#A1A1AA" }}>{d.type}</span>
                  <span style={{ color: "#D4AF37" }}>{d.pct}% · USD {d.value.toFixed(2)}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "#222" }}>
                  <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: "linear-gradient(90deg, #FF9A00, #D4AF37)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-center py-4" style={{ color: "#6B6358" }}>Sin datos de portafolio</div>
        )}
      </div>

      {/* Perfil de riesgo */}
      <div className="p-5 rounded-xl mb-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="font-bold text-white mb-4 text-sm">Perfil de riesgo del portafolio</div>
        <div className="flex flex-col gap-3">
          {riskProfile.map(r => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "#A1A1AA" }}>Riesgo {r.label}</span>
                <span style={{ color: r.color }}>{r.pct}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "#222" }}>
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas próximamente */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "🌎", label: "Por país",          estado: "Próximamente" },
          { icon: "📅", label: "Por horizonte",     estado: "Próximamente" },
          { icon: "💱", label: "Por moneda",        estado: "Próximamente" },
          { icon: "🔄", label: "Correlación",       estado: "Próximamente" },
        ].map(m => (
          <div key={m.label} className="p-4 rounded-xl text-center opacity-60"
               style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-2xl mb-1">{m.icon}</div>
            <div className="text-xs font-semibold text-white">{m.label}</div>
            <div className="text-xs mt-0.5" style={{ color: "#52525B" }}>{m.estado}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
