"use client";
import Image from "next/image";
import { useState } from "react";
import { MKT_PRICE_USD } from "./wallet-data";
import { User } from "@/types";

interface Props { user: User; }

const ACTIONS = [
  { id: "comprar",   icon: "⬇️", label: "Comprar",   color: "#10B981" },
  { id: "vender",    icon: "⬆️", label: "Vender",    color: "#EF4444" },
  { id: "enviar",    icon: "📤", label: "Enviar",    color: "#FF9A00" },
  { id: "recibir",   icon: "📥", label: "Recibir",   color: "#38BDF8" },
  { id: "convertir", icon: "🔄", label: "Convertir", color: "#A78BFA" },
];

export default function WalletMKT({ user }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const usd = (user.mktBalance * MKT_PRICE_USD).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div>
      {/* Balance card */}
      <div className="p-6 rounded-2xl mb-6 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #1A1200, #111111)", border: "1px solid rgba(212,175,55,0.3)" }}>
        <div className="absolute inset-0 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(255,154,0,0.07) 0%, transparent 60%)" }} />
        <div className="flex items-center gap-4 relative">
          <Image src="/logo-mkt.jpg" alt="MKT" width={64} height={64}
                 className="rounded-full object-cover flex-shrink-0" />
          <div>
            <div className="text-xs mb-1 tracking-widest uppercase" style={{ color: "#6B6358" }}>Balance MKT</div>
            <div className="text-3xl font-bold" style={{ color: "#D4AF37" }}>
              {user.mktBalance.toLocaleString()} <span className="text-lg" style={{ color: "#FF9A00" }}>MKT</span>
            </div>
            <div className="text-sm mt-1" style={{ color: "#6B6358" }}>≈ USD {usd}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs mb-1" style={{ color: "#6B6358" }}>Precio MKT</div>
            <div className="font-bold" style={{ color: "#D4AF37" }}>USD {MKT_PRICE_USD.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {ACTIONS.map(a => (
          <button key={a.id} onClick={() => setActive(a.id)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition"
                  style={{ background: "#111111", border: `1px solid ${active === a.id ? a.color + "60" : "rgba(255,255,255,0.07)"}`, color: active === a.id ? a.color : "#A1A1AA" }}>
            <span className="text-xl">{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      {/* Panel de acción seleccionada */}
      {active && (
        <div className="p-5 rounded-xl mb-4" style={{ background: "#111111", border: "1px solid rgba(255,154,0,0.2)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">{ACTIONS.find(a => a.id === active)?.label} MKT</h3>
            <button onClick={() => setActive(null)} style={{ color: "#6B6358" }}>✕</button>
          </div>
          <div className="p-4 rounded-lg text-sm text-center" style={{ background: "rgba(255,154,0,0.06)", border: "1px solid rgba(255,154,0,0.15)", color: "#FF9A00" }}>
            🔜 Esta función estará disponible cuando se integre la pasarela de pago y el contrato inteligente MKT.
          </div>
          <div className="mt-3 text-xs text-center" style={{ color: "#52525B" }}>
            Arquitectura preparada para integraciones con stablecoins, APIs bancarias y mercado secundario.
          </div>
        </div>
      )}

      {/* Info del token */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Suministro total", value: "100.000.000 MKT" },
          { label: "Tipo",             value: "Utility Token" },
          { label: "Red",              value: "Próximamente" },
        ].map(i => (
          <div key={i.label} className="p-3 rounded-xl text-center" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-xs mb-1" style={{ color: "#6B6358" }}>{i.label}</div>
            <div className="text-xs font-semibold text-white">{i.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
