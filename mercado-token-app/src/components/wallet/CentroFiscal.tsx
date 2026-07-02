"use client";
import { MOCK_PORTFOLIO, MOCK_DIVIDENDS, MOCK_TRANSACTIONS, MKT_PRICE_USD } from "./wallet-data";
import { User } from "@/types";

interface Props { user: User; }

export default function CentroFiscal({ user }: Props) {
  const portfolioValue  = MOCK_PORTFOLIO.reduce((s, a) => s + a.currentValue, 0);
  const totalPatrimonio = user.mktBalance * MKT_PRICE_USD + portfolioValue;
  const dividendos      = MOCK_DIVIDENDS.filter(d => d.status === "pagado").reduce((s, d) => s + d.amount, 0);
  const compras         = MOCK_TRANSACTIONS.filter(t => t.type === "compra").reduce((s, t) => s + t.amount, 0);

  const reportes = [
    { icon: "📊", label: "Reporte patrimonial",   desc: "Valor total del portafolio al día de hoy",            valor: `USD ${totalPatrimonio.toFixed(2)}` },
    { icon: "💸", label: "Dividendos percibidos",  desc: "Total de dividendos cobrados en el período",          valor: `${dividendos} MKT` },
    { icon: "📤", label: "Capital invertido",       desc: "Total de compras de tokens realizadas",               valor: `${compras} MKT` },
    { icon: "📈", label: "Rentabilidad neta",       desc: "Ganancia sobre el capital invertido",                 valor: `+${((portfolioValue - compras) / (compras || 1) * 100).toFixed(1)}%` },
  ];

  const exportaciones = [
    { icon: "📄", label: "Estado patrimonial PDF",   formato: "PDF" },
    { icon: "📋", label: "Movimientos Excel",         formato: "Excel" },
    { icon: "💰", label: "Reporte de dividendos PDF", formato: "PDF" },
    { icon: "🧾", label: "Comprobantes de inversión", formato: "ZIP" },
  ];

  return (
    <div>
      {/* Métricas fiscales */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {reportes.map(r => (
          <div key={r.label} className="flex items-center justify-between p-4 rounded-xl"
               style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{r.icon}</span>
              <div>
                <div className="font-semibold text-white text-sm">{r.label}</div>
                <div className="text-xs" style={{ color: "#6B6358" }}>{r.desc}</div>
              </div>
            </div>
            <div className="font-bold text-sm" style={{ color: "#D4AF37" }}>{r.valor}</div>
          </div>
        ))}
      </div>

      {/* Exportaciones */}
      <div className="p-5 rounded-xl mb-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="font-bold text-white mb-4 text-sm">Exportar reportes</div>
        <div className="grid grid-cols-2 gap-2">
          {exportaciones.map(e => (
            <button key={e.label}
                    className="flex items-center gap-2 p-3 rounded-lg text-left transition hover:border-orange-500/20"
                    style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-lg">{e.icon}</span>
              <div>
                <div className="text-xs font-semibold text-white">{e.label}</div>
                <div className="text-xs" style={{ color: "#52525B" }}>{e.formato} · Próximamente</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl text-xs text-center" style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)", color: "#6B6358" }}>
        Los reportes fiscales estarán disponibles para descarga cuando se integren los módulos de contabilidad y cumplimiento regulatorio. La información presentada es orientativa.
      </div>
    </div>
  );
}
