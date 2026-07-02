"use client";
import Link from "next/link";
import { MOCK_FAVORITES } from "./wallet-data";

const FEATURED = [
  { icon: "🏢", name: "Torre Catalinas Norte",   type: "Inmueble comercial",    ret: "15% anual", pct: 72, price: 10  },
  { icon: "☀️", name: "Parque Solar Mendoza",    type: "Energía renovable",     ret: "12% anual", pct: 55, price: 10  },
  { icon: "🍇", name: "Bodega Valle de Uco",     type: "Agroindustria",         ret: "10% anual", pct: 34, price: 5   },
  { icon: "🏙️", name: "Puerto Madero Residencial", type: "Inmueble residencial", ret: "9% anual",  pct: 61, price: 20  },
];

export default function MarketplaceAcceso() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: "#A1A1AA" }}>Activos disponibles para invertir</p>
        <Link href="/marketplace"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,154,0,0.1)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.25)", textDecoration: "none" }}>
          Ver todos →
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {FEATURED.map(a => (
          <div key={a.name} className="flex items-center justify-between p-4 rounded-xl transition hover:border-orange-500/30"
               style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{a.icon}</span>
              <div>
                <div className="font-semibold text-white text-sm">{a.name}</div>
                <div className="text-xs" style={{ color: "#6B6358" }}>{a.type}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold" style={{ color: "#10B981" }}>{a.ret}</div>
              <div className="text-xs mt-0.5" style={{ color: "#6B6358" }}>USD {a.price}/token · {a.pct}% financiado</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "rgba(255,154,0,0.04)", border: "1px solid rgba(255,154,0,0.15)" }}>
        <div className="text-sm font-semibold mb-1" style={{ color: "#FF9A00" }}>Alertas de nuevos activos</div>
        <div className="text-xs mb-3" style={{ color: "#6B6358" }}>Recibí notificaciones cuando se publiquen activos de tu interés.</div>
        <button className="text-xs px-4 py-2 rounded-lg font-semibold"
                style={{ background: "rgba(255,154,0,0.1)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.25)" }}>
          Configurar alertas — Próximamente
        </button>
      </div>
    </div>
  );
}
