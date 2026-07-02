"use client";
import Link from "next/link";
import { useState } from "react";
import { MOCK_FAVORITES } from "./wallet-data";

export default function Favoritos() {
  const [favorites, setFavorites] = useState(MOCK_FAVORITES);

  function remove(id: string) {
    setFavorites(f => f.filter(x => x.id !== id));
  }

  return (
    <div>
      <p className="text-sm mb-5" style={{ color: "#A1A1AA" }}>
        Seguí de cerca los activos que te interesan antes de invertir.
      </p>

      {favorites.length > 0 ? (
        <div className="flex flex-col gap-3">
          {favorites.map(f => (
            <div key={f.id} className="p-4 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <div className="font-semibold text-white text-sm">{f.name}</div>
                    <div className="text-xs" style={{ color: "#6B6358" }}>{f.type}</div>
                  </div>
                </div>
                <button onClick={() => remove(f.id)} className="text-lg" style={{ color: "#6B6358" }} title="Quitar de favoritos">
                  ★
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg text-center" style={{ background: "#0A0A0A" }}>
                  <div className="text-xs mb-0.5" style={{ color: "#6B6358" }}>Precio</div>
                  <div className="font-bold text-white text-sm">USD {f.tokenPrice}</div>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ background: "#0A0A0A" }}>
                  <div className="text-xs mb-0.5" style={{ color: "#6B6358" }}>Retorno est.</div>
                  <div className="font-bold text-sm" style={{ color: "#10B981" }}>{f.expectedReturn}</div>
                </div>
                <div className="p-2 rounded-lg text-center" style={{ background: "#0A0A0A" }}>
                  <div className="text-xs mb-0.5" style={{ color: "#6B6358" }}>Financiado</div>
                  <div className="font-bold text-white text-sm">{f.fundedPercent}%</div>
                </div>
              </div>

              <div className="w-full h-1 rounded-full mb-3" style={{ background: "#222" }}>
                <div className="h-full rounded-full" style={{ width: `${f.fundedPercent}%`, background: "linear-gradient(90deg, #FF9A00, #D4AF37)" }} />
              </div>

              <Link href={`/marketplace/${f.id}`}
                    className="block w-full text-center py-2 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(255,154,0,0.08)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.2)", textDecoration: "none" }}>
                Ver detalle →
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12" style={{ color: "#6B6358" }}>
          <div className="text-4xl mb-3">⭐</div>
          <div className="font-semibold text-white mb-1">Sin favoritos</div>
          <div className="text-sm mb-4">Agregá activos desde el marketplace para seguirlos acá.</div>
          <Link href="/marketplace"
                className="text-sm px-4 py-2 rounded-lg inline-block"
                style={{ background: "rgba(255,154,0,0.1)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.25)", textDecoration: "none" }}>
            Ir al marketplace →
          </Link>
        </div>
      )}
    </div>
  );
}
