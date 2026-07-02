"use client";
import { MOCK_PORTFOLIO } from "./wallet-data";

const STATUS_LABEL: Record<string, string> = { activo: "Activo", liquidado: "Liquidado", en_revision: "En revisión" };
const STATUS_COLOR: Record<string, string> = { activo: "#10B981", liquidado: "#6B6358", en_revision: "#F59E0B" };

export default function MiPortafolio() {
  const total = MOCK_PORTFOLIO.reduce((s, a) => s + a.currentValue, 0);
  const ganancia = MOCK_PORTFOLIO.reduce((s, a) => s + (a.currentValue - a.purchaseValue), 0);

  return (
    <div>
      {/* Resumen portafolio */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,154,0,0.2)" }}>
          <div className="text-xs mb-1" style={{ color: "#6B6358" }}>Valor total</div>
          <div className="font-bold text-lg" style={{ color: "#D4AF37" }}>USD {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div className="text-xs mb-1" style={{ color: "#6B6358" }}>Ganancia total</div>
          <div className="font-bold text-lg" style={{ color: "#10B981" }}>+USD {ganancia.toFixed(2)}</div>
        </div>
      </div>

      {/* Activos */}
      <div className="flex flex-col gap-4">
        {MOCK_PORTFOLIO.map(asset => {
          const gananciaActivo = asset.currentValue - asset.purchaseValue;
          const pct = asset.returnPct;
          return (
            <div key={asset.id} className="p-5 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{asset.icon}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{asset.name}</div>
                    <div className="text-xs" style={{ color: "#6B6358" }}>{asset.type}</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: STATUS_COLOR[asset.status] + "20", color: STATUS_COLOR[asset.status], border: `1px solid ${STATUS_COLOR[asset.status]}40` }}>
                  {STATUS_LABEL[asset.status]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg text-center" style={{ background: "#0A0A0A" }}>
                  <div className="text-xs mb-0.5" style={{ color: "#6B6358" }}>Tokens</div>
                  <div className="font-bold text-white text-sm">{asset.tokensOwned}</div>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ background: "#0A0A0A" }}>
                  <div className="text-xs mb-0.5" style={{ color: "#6B6358" }}>Valor actual</div>
                  <div className="font-bold text-white text-sm">USD {asset.currentValue.toFixed(2)}</div>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ background: "#0A0A0A" }}>
                  <div className="text-xs mb-0.5" style={{ color: "#6B6358" }}>Rentabilidad</div>
                  <div className="font-bold text-sm" style={{ color: "#10B981" }}>+{pct}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs" style={{ color: "#6B6358" }}>
                <span>Ganancia: <span style={{ color: "#10B981" }}>+USD {gananciaActivo.toFixed(2)}</span></span>
                {asset.nextDividend && (
                  <span>Próximo dividendo: <span style={{ color: "#A78BFA" }}>{asset.nextDividendAmount} MKT · {asset.nextDividend}</span></span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {MOCK_PORTFOLIO.length === 0 && (
        <div className="text-center py-12" style={{ color: "#6B6358" }}>
          <div className="text-4xl mb-3">📊</div>
          <div className="font-semibold text-white mb-1">Sin inversiones activas</div>
          <div className="text-sm">Explorá el marketplace para comenzar a invertir.</div>
        </div>
      )}
    </div>
  );
}
