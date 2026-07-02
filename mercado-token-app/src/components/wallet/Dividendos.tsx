"use client";
import { MOCK_DIVIDENDS } from "./wallet-data";

const STATUS_LABEL: Record<string, string> = { pagado: "Acreditado", pendiente: "Pendiente", programado: "Programado" };
const STATUS_COLOR: Record<string, string> = { pagado: "#10B981", pendiente: "#F59E0B", programado: "#38BDF8" };
const STATUS_ICON:  Record<string, string> = { pagado: "✅", pendiente: "⏳", programado: "📅" };

export default function Dividendos() {
  const pagados   = MOCK_DIVIDENDS.filter(d => d.status === "pagado").reduce((s, d) => s + d.amount, 0);
  const proximos  = MOCK_DIVIDENDS.filter(d => d.status !== "pagado").reduce((s, d) => s + d.amount, 0);

  return (
    <div>
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(167,139,250,0.25)" }}>
          <div className="text-xs mb-1" style={{ color: "#6B6358" }}>Total cobrado</div>
          <div className="font-bold text-lg" style={{ color: "#A78BFA" }}>{pagados} MKT</div>
          <div className="text-xs mt-0.5" style={{ color: "#52525B" }}>≈ USD {pagados.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(56,189,248,0.25)" }}>
          <div className="text-xs mb-1" style={{ color: "#6B6358" }}>Próximos pagos</div>
          <div className="font-bold text-lg" style={{ color: "#38BDF8" }}>{proximos} MKT</div>
          <div className="text-xs mt-0.5" style={{ color: "#52525B" }}>≈ USD {proximos.toFixed(2)}</div>
        </div>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2 mb-6">
        {MOCK_DIVIDENDS.map(d => (
          <div key={d.id} className="flex items-center justify-between p-4 rounded-xl"
               style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{STATUS_ICON[d.status]}</span>
              <div>
                <div className="text-sm font-semibold text-white">{d.assetName}</div>
                <div className="text-xs" style={{ color: "#6B6358" }}>{d.date}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm" style={{ color: STATUS_COLOR[d.status] }}>
                +{d.amount} {d.currency}
              </div>
              <div className="text-xs mt-0.5" style={{ color: STATUS_COLOR[d.status] + "99" }}>
                {STATUS_LABEL[d.status]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Proyección */}
      <div className="p-4 rounded-xl" style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)" }}>
        <div className="text-sm font-semibold mb-1" style={{ color: "#A78BFA" }}>Proyección anual de dividendos</div>
        <div className="text-xs" style={{ color: "#6B6358" }}>
          Basado en tu portafolio actual, se estima una percepción de <span style={{ color: "#A78BFA" }}>~240 MKT/año</span> en dividendos. La proyección completa estará disponible cuando se integre el motor de cálculo de rendimientos.
        </div>
      </div>
    </div>
  );
}
