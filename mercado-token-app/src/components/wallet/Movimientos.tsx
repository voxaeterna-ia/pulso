"use client";
import { useState } from "react";
import { MOCK_TRANSACTIONS, WalletTransaction } from "./wallet-data";

const TX_ICON:  Record<string, string> = { compra: "📤", venta: "📥", deposito: "⬇️", retiro: "⬆️", reward: "🎁", dividendo: "💸", staking: "🔒" };
const TX_COLOR: Record<string, string> = { compra: "#EF4444", venta: "#10B981", deposito: "#10B981", retiro: "#EF4444", reward: "#F59E0B", dividendo: "#A78BFA", staking: "#38BDF8" };
const TX_SIGN:  Record<string, string> = { compra: "−", venta: "+", deposito: "+", retiro: "−", reward: "+", dividendo: "+", staking: "+" };
const STATUS_COLOR: Record<string, string> = { completado: "#10B981", pendiente: "#F59E0B", procesando: "#38BDF8" };

const FILTERS = ["Todos", "Compras", "Depósitos", "Rewards", "Dividendos"];
const FILTER_MAP: Record<string, WalletTransaction["type"][]> = {
  Todos: ["compra", "venta", "deposito", "retiro", "reward", "dividendo", "staking"],
  Compras: ["compra"], Depósitos: ["deposito"], Rewards: ["reward"], Dividendos: ["dividendo"],
};

export default function Movimientos() {
  const [filter, setFilter] = useState("Todos");

  const filtered = MOCK_TRANSACTIONS.filter(t => FILTER_MAP[filter].includes(t.type))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
                  style={{
                    background: filter === f ? "rgba(255,154,0,0.15)" : "rgba(255,255,255,0.04)",
                    color:      filter === f ? "#FF9A00" : "#6B6358",
                    border:     `1px solid ${filter === f ? "rgba(255,154,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                  }}>
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {filtered.map(tx => (
          <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl"
               style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="text-xl w-8 text-center">{TX_ICON[tx.type]}</div>
              <div>
                <div className="text-sm font-semibold text-white">{tx.description}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: "#6B6358" }}>{tx.date}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                        style={{ background: STATUS_COLOR[tx.status] + "20", color: STATUS_COLOR[tx.status] }}>
                    {tx.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: TX_COLOR[tx.type] }}>
                {TX_SIGN[tx.type]}{tx.amount.toLocaleString()} {tx.currency}
              </div>
              {tx.comprobante && (
                <button className="text-xs mt-0.5" style={{ color: "#6B6358" }}>📄 Ver comprobante</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10" style={{ color: "#6B6358" }}>Sin movimientos en esta categoría.</div>
      )}

      <div className="mt-4 text-center">
        <button className="text-xs px-4 py-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", color: "#6B6358", border: "1px solid rgba(255,255,255,0.07)" }}>
          Exportar historial — Próximamente
        </button>
      </div>
    </div>
  );
}
