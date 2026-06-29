"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getIntentionsByInvestor } from "@/lib/services/firestore";
import { InvestmentIntention } from "@/types";
import { EscrowService } from "@/lib/services/escrow";
import { SECTORS } from "@/lib/constants";

const ALL_STATUSES = ["initiated", "pending_review", "payment_pending", "funds_held", "approved", "released", "completed", "cancelled", "refunded", "disputed"] as const;

export default function InversionesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [intentions, setIntentions] = useState<InvestmentIntention[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && user.role !== "inversor") { router.push("/dashboard"); return; }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    getIntentionsByInvestor(user.id).catch(() => []).then(i => { setIntentions(i); setDataLoading(false); });
  }, [user]);

  if (loading || !user) return <Spinner />;

  const filtered = filter === "all" ? intentions : intentions.filter(i => i.status === filter);
  const totalInvested = intentions
    .filter(i => !["cancelled", "refunded"].includes(i.status))
    .reduce((sum, i) => sum + i.amountUSD, 0);

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-4xl mx-auto">

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white">Mis inversiones</h1>
          <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>Historial de intenciones de inversión y operaciones</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total invertido",  value: `USD ${totalInvested.toLocaleString()}`, color: "#D4AF37" },
            { label: "Operaciones",      value: intentions.length.toString(),            color: "#FF9A00" },
            { label: "Activas",          value: intentions.filter(i => !["completed","cancelled","refunded"].includes(i.status)).length.toString(), color: "#10B981" },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-xs mb-1 uppercase tracking-wider" style={{ color: "#6B6358" }}>{s.label}</div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-6">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>Todas</FilterBtn>
          {["initiated", "pending_review", "funds_held", "completed", "cancelled"].map(s => (
            <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
              {EscrowService.getStatusLabel(s as Parameters<typeof EscrowService.getStatusLabel>[0])}
            </FilterBtn>
          ))}
        </div>

        {dataLoading ? (
          <div className="text-center py-16" style={{ color: "#6B6358" }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-4xl mb-3">📊</div>
            {intentions.length === 0 ? (
              <>
                <div className="font-semibold text-white mb-2">Todavía no tenés inversiones</div>
                <div className="text-sm mb-4" style={{ color: "#A1A1AA" }}>Explorá el marketplace para encontrar activos disponibles.</div>
                <Link href="/marketplace"
                      className="inline-block px-5 py-2.5 rounded-lg font-semibold text-sm"
                      style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none" }}>
                  Ir al marketplace →
                </Link>
              </>
            ) : (
              <div className="font-semibold text-white">Sin resultados para el filtro seleccionado</div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(inv => {
              const color = EscrowService.getStatusColor(inv.status);
              const sector = SECTORS.find(s => s.id === inv.assetType);
              const lastEntry = inv.statusHistory?.[inv.statusHistory.length - 1];
              return (
                <div key={inv.id} className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{sector?.icon ?? "📦"}</span>
                      <div>
                        <div className="font-bold text-white">{inv.assetName}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>
                          USD {inv.amountUSD.toLocaleString()} · {inv.estimatedTokens} tokens
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#6B6358" }}>
                          {new Date(inv.createdAt as unknown as string).toLocaleDateString("es-AR")}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                      {EscrowService.getStatusLabel(inv.status)}
                    </span>
                  </div>

                  {/* Timeline de estados */}
                  {inv.statusHistory && inv.statusHistory.length > 1 && (
                    <div className="mt-4 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <div className="text-xs mb-2" style={{ color: "#6B6358" }}>Historial</div>
                      <div className="flex gap-2 flex-wrap">
                        {inv.statusHistory.map((h, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(255,255,255,0.04)", color: "#6B6358", border: "1px solid rgba(255,255,255,0.06)" }}>
                            {EscrowService.getStatusLabel(h.status)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lastEntry?.note && (
                    <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", color: "#A1A1AA" }}>
                      <strong style={{ color: "#3B82F6" }}>Nota:</strong> {lastEntry.note}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t flex justify-end" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <Link href={`/marketplace/${inv.assetId}`} className="text-xs"
                          style={{ color: "#FF9A00", textDecoration: "none" }}>
                      Ver activo →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-semibold transition"
            style={{
              background: active ? "rgba(255,154,0,0.15)" : "rgba(255,255,255,0.04)",
              color: active ? "#FF9A00" : "#6B6358",
              border: `1px solid ${active ? "rgba(255,154,0,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}>
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#FF9A00", borderTopColor: "transparent" }} />
    </div>
  );
}
