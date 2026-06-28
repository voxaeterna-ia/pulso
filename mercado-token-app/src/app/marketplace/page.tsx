"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { MOCK_ASSETS, SECTORS } from "@/lib/constants";
import { Asset } from "@/types";

export default function MarketplacePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sector, setSector]   = useState("todos");
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [investing, setInvesting] = useState(false);
  const [tokens, setTokens]   = useState(1);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const filtered = MOCK_ASSETS.filter(a => {
    const matchSector = sector === "todos" || a.sector === sector;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                        a.location.toLowerCase().includes(search.toLowerCase());
    return matchSector && matchSearch;
  });

  function handleInvest() {
    alert(`✅ Solicitud de inversión enviada\n\n${tokens} tokens de "${selected?.name}"\nTotal: USD ${(tokens * (selected?.tokenPrice ?? 0)).toLocaleString()}\n\nTu operación quedó registrada. El equipo de Mercado Token la procesará en breve.`);
    setSelected(null);
    setInvesting(false);
    setTokens(1);
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-6xl mx-auto">

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Marketplace</h1>
          <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>Activos tokenizados disponibles para inversión</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Buscar por nombre o ubicación..."
                 className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm outline-none"
                 style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }} />
          <select value={sector} onChange={e => setSector(e.target.value)}
                  className="px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", color: sector === "todos" ? "#A1A1AA" : "#fff" }}>
            <option value="todos">Todos los sectores</option>
            {SECTORS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(asset => {
            const sec = SECTORS.find(s => s.id === asset.sector);
            const pct = Math.round(((asset.tokensTotal - asset.tokensAvailable) / asset.tokensTotal) * 100);
            const STATUS_COLOR: Record<string, string> = { activo: "#10B981", preventa: "#3B82F6", cerrado: "#6B7280", pausado: "#F59E0B" };
            return (
              <div key={asset.id} onClick={() => setSelected(asset)}
                   className="p-5 rounded-xl cursor-pointer transition hover:border-orange-500/40"
                   style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sec?.icon}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(255,154,0,0.12)", color: "var(--copper)", border: "1px solid rgba(255,154,0,0.25)" }}>
                      {sec?.tag}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                        style={{ background: `${STATUS_COLOR[asset.status]}22`, color: STATUS_COLOR[asset.status] }}>
                    {asset.status}
                  </span>
                </div>

                <h3 className="font-bold text-white mb-1">{asset.name}</h3>
                <p className="text-xs mb-4" style={{ color: "#6B6358" }}>{asset.location}</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: "Valor total",  value: `USD ${(asset.totalValue / 1000).toFixed(0)}K` },
                    { label: "Precio token", value: `USD ${asset.tokenPrice}` },
                    { label: "Retorno est.", value: asset.expectedReturn, green: true },
                    { label: "Plazo",        value: asset.term },
                  ].map(s => (
                    <div key={s.label} className="p-2.5 rounded-lg" style={{ background: "#161616" }}>
                      <div className="text-xs mb-0.5" style={{ color: "#6B6358" }}>{s.label}</div>
                      <div className="text-sm font-semibold" style={{ color: s.green ? "#10B981" : "#fff" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="w-full h-1.5 rounded-full mb-1" style={{ background: "#222" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FF9A00, #D4AF37)" }} />
                </div>
                <div className="flex justify-between text-xs" style={{ color: "#6B6358" }}>
                  <span>{pct}% colocado</span>
                  <span>{asset.tokensAvailable.toLocaleString()} tokens disponibles</span>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20" style={{ color: "#6B6358" }}>
            <div className="text-4xl mb-4">🔍</div>
            <div>No se encontraron activos con ese filtro.</div>
          </div>
        )}
      </main>

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: "rgba(0,0,0,0.8)" }}
             onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setInvesting(false); } }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
               style={{ background: "#111111", border: "1px solid rgba(255,154,0,0.2)" }}>
            {!investing ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{SECTORS.find(s => s.id === selected.sector)?.icon}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(255,154,0,0.12)", color: "var(--copper)" }}>
                      {SECTORS.find(s => s.id === selected.sector)?.tag}
                    </span>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ color: "#6B6358" }} className="text-xl">✕</button>
                </div>

                <h2 className="text-xl font-bold text-white mb-1">{selected.name}</h2>
                <p className="text-sm mb-4" style={{ color: "#A1A1AA" }}>{selected.location}</p>
                <p className="text-sm mb-5" style={{ color: "#A1A1AA", lineHeight: 1.7 }}>{selected.description}</p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: "Valor total",       value: `USD ${selected.totalValue.toLocaleString()}` },
                    { label: "Precio por token",  value: `USD ${selected.tokenPrice}` },
                    { label: "Tokens disponibles",value: selected.tokensAvailable.toLocaleString() },
                    { label: "Retorno estimado",  value: selected.expectedReturn, green: true },
                    { label: "Plazo",             value: selected.term },
                    { label: "Estado",            value: selected.status },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-lg" style={{ background: "#161616" }}>
                      <div className="text-xs mb-0.5" style={{ color: "#6B6358" }}>{s.label}</div>
                      <div className="text-sm font-semibold capitalize" style={{ color: s.green ? "#10B981" : "#fff" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => setInvesting(true)}
                        className="w-full py-3 rounded-lg font-bold text-sm"
                        style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
                  Invertir en este activo
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-white mb-4">Confirmar inversión</h2>
                <p className="text-sm mb-1" style={{ color: "#A1A1AA" }}>{selected.name}</p>

                <div className="mb-5">
                  <label className="block text-sm mb-2" style={{ color: "#A1A1AA" }}>Cantidad de tokens</label>
                  <input type="number" min={1} max={selected.tokensAvailable} value={tokens}
                         onChange={e => setTokens(Math.max(1, parseInt(e.target.value) || 1))}
                         className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none"
                         style={{ background: "#161616", border: "1px solid rgba(255,154,0,0.4)" }} />
                  <div className="mt-2 flex justify-between text-sm">
                    <span style={{ color: "#A1A1AA" }}>Total a invertir:</span>
                    <strong style={{ color: "var(--gold-light)" }}>USD {(tokens * selected.tokenPrice).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setInvesting(false)}
                          className="flex-1 py-3 rounded-lg font-semibold text-sm"
                          style={{ background: "#161616", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.07)" }}>
                    Atrás
                  </button>
                  <button onClick={handleInvest}
                          className="flex-1 py-3 rounded-lg font-bold text-sm"
                          style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000" }}>
                    Confirmar inversión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
