"use client";
import { useState } from "react";
import { MKT_PRICE_USD } from "./wallet-data";

export default function Simulador() {
  const [capital, setCapital]  = useState(1000);
  const [plazo, setPlazo]      = useState(12);
  const [retorno, setRetorno]  = useState(12);

  const gananciaAnual = (capital * retorno) / 100;
  const gananciaPlazo = (gananciaAnual * plazo) / 12;
  const totalFinal    = capital + gananciaPlazo;
  const tokensEquiv   = Math.floor(capital / (10 * MKT_PRICE_USD));

  return (
    <div>
      <p className="text-sm mb-6" style={{ color: "#A1A1AA" }}>
        Simulá cuánto podrías ganar invirtiendo en activos tokenizados. Los cálculos son estimaciones orientativas y no garantizan rendimientos futuros.
      </p>

      {/* Controles */}
      <div className="flex flex-col gap-5 mb-6 p-5 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-semibold text-white">Capital inicial (USD)</label>
            <span className="text-xs font-bold" style={{ color: "#D4AF37" }}>USD {capital.toLocaleString()}</span>
          </div>
          <input type="range" min={100} max={50000} step={100} value={capital}
                 onChange={e => setCapital(Number(e.target.value))}
                 className="w-full accent-orange-500" />
          <div className="flex justify-between text-xs mt-1" style={{ color: "#52525B" }}>
            <span>USD 100</span><span>USD 50.000</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-semibold text-white">Plazo</label>
            <span className="text-xs font-bold" style={{ color: "#D4AF37" }}>{plazo} meses</span>
          </div>
          <input type="range" min={1} max={60} step={1} value={plazo}
                 onChange={e => setPlazo(Number(e.target.value))}
                 className="w-full accent-orange-500" />
          <div className="flex justify-between text-xs mt-1" style={{ color: "#52525B" }}>
            <span>1 mes</span><span>60 meses</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs font-semibold text-white">Retorno anual estimado</label>
            <span className="text-xs font-bold" style={{ color: "#10B981" }}>{retorno}% anual</span>
          </div>
          <input type="range" min={4} max={25} step={1} value={retorno}
                 onChange={e => setRetorno(Number(e.target.value))}
                 className="w-full accent-orange-500" />
          <div className="flex justify-between text-xs mt-1" style={{ color: "#52525B" }}>
            <span>4%</span><span>25%</span>
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="p-5 rounded-xl mb-4" style={{ background: "linear-gradient(135deg, #1A1200, #111111)", border: "1px solid rgba(212,175,55,0.3)" }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs mb-1" style={{ color: "#6B6358" }}>Valor final estimado</div>
            <div className="text-2xl font-bold" style={{ color: "#D4AF37" }}>USD {totalFinal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#6B6358" }}>Ganancia estimada</div>
            <div className="text-2xl font-bold" style={{ color: "#10B981" }}>+USD {gananciaPlazo.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#6B6358" }}>Tokens equivalentes</div>
            <div className="font-bold text-white">~{tokensEquiv} tokens</div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#6B6358" }}>Rentabilidad total</div>
            <div className="font-bold" style={{ color: "#10B981" }}>+{((gananciaPlazo / capital) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="text-xs text-center" style={{ color: "#52525B" }}>
        Simulación orientativa. Los rendimientos pasados no garantizan resultados futuros. No constituye asesoramiento financiero.
      </div>
    </div>
  );
}
