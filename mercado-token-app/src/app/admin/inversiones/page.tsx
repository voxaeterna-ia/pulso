"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAllIntentions, updateIntentionStatus, addAuditLog } from "@/lib/services/firestore";
import { InvestmentIntention, InvestmentStatus } from "@/types";
import { EscrowService } from "@/lib/services/escrow";
import { SECTORS } from "@/lib/constants";

export default function AdminInversionesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [intentions, setIntentions] = useState<InvestmentIntention[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [dataLoading, setDataLoading] = useState(true);
  const [selected, setSelected] = useState<InvestmentIntention | null>(null);
  const [newStatus, setNewStatus] = useState<InvestmentStatus | "">("");
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && user.role !== "admin") { router.push("/dashboard"); return; }
  }, [user, loading, router]);

  async function load() {
    getAllIntentions().catch(() => []).then(i => { setIntentions(i); setDataLoading(false); });
  }

  useEffect(() => { if (user) load(); }, [user]);

  if (loading || !user) return <Spinner />;

  const filtered = filter === "all" ? intentions : intentions.filter(i => i.status === filter);

  async function handleAction() {
    if (!selected || !newStatus || !user) return;
    setProcessing(true);
    setError("");
    try {
      await updateIntentionStatus(selected.id, newStatus as InvestmentStatus, user.id, note || undefined);
      await addAuditLog({
        actorId: user.id,
        actorRole: "admin",
        action: `intention_${newStatus}`,
        entityType: "intention",
        entityId: selected.id,
        details: { note, previousStatus: selected.status, investorId: selected.investorId },
      });
      setSelected(null);
      setNewStatus("");
      setNote("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al actualizar estado");
    } finally {
      setProcessing(false);
    }
  }

  const TRANSITION_ACTIONS: { value: InvestmentStatus; label: string; color: string }[] = [
    { value: "pending_review",  label: "Poner en revisión",    color: "#3B82F6" },
    { value: "payment_pending", label: "Solicitar pago",       color: "#F59E0B" },
    { value: "funds_held",      label: "Marcar fondos retenidos", color: "#8B5CF6" },
    { value: "approved",        label: "Aprobar operación",    color: "#10B981" },
    { value: "released",        label: "Liberar fondos",       color: "#10B981" },
    { value: "completed",       label: "Marcar completada",    color: "#10B981" },
    { value: "cancelled",       label: "Cancelar",             color: "#EF4444" },
    { value: "refunded",        label: "Reembolsar",           color: "#F59E0B" },
    { value: "disputed",        label: "Marcar en disputa",    color: "#EF4444" },
  ];

  const validActions = selected
    ? TRANSITION_ACTIONS.filter(a => EscrowService.canTransitionIntention(selected.status, a.value))
    : [];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-6xl mx-auto">

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white">Operaciones de escrow</h1>
          <p className="text-sm mt-1" style={{ color: "#A1A1AA" }}>Gestión de intenciones de inversión · Custodia simulada</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { v: "all",            l: "Todas" },
            { v: "pending_review", l: "En revisión" },
            { v: "funds_held",     l: "Fondos retenidos" },
            { v: "approved",       l: "Aprobadas" },
            { v: "completed",      l: "Completadas" },
            { v: "cancelled",      l: "Canceladas" },
          ].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: filter === f.v ? "rgba(255,154,0,0.15)" : "rgba(255,255,255,0.04)",
                      color: filter === f.v ? "#FF9A00" : "#6B6358",
                      border: `1px solid ${filter === f.v ? "rgba(255,154,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}>
              {f.l} ({f.v === "all" ? intentions.length : intentions.filter(i => i.status === f.v).length})
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="text-center py-16" style={{ color: "#6B6358" }}>Cargando operaciones...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-3xl mb-3">💼</div>
            <div className="font-semibold text-white">Sin operaciones en este estado</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(inv => {
              const color = EscrowService.getStatusColor(inv.status);
              const sector = SECTORS.find(s => s.id === inv.assetType);
              return (
                <div key={inv.id} className="p-5 rounded-xl" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{sector?.icon ?? "📦"}</span>
                      <div>
                        <div className="font-bold text-white">{inv.assetName}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>
                          Inversor: {inv.investorName}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#6B6358" }}>
                          USD {inv.amountUSD.toLocaleString()} · {inv.estimatedTokens} tokens · Token USD {inv.tokenPrice}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
                      {EscrowService.getStatusLabel(inv.status)}
                    </span>
                  </div>

                  {/* Historial de estados */}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {(inv.statusHistory ?? []).map((h, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: "rgba(255,255,255,0.04)", color: "#6B6358", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {EscrowService.getStatusLabel(h.status)}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-end mt-4 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <button onClick={() => { setSelected(inv); setNewStatus(""); setNote(""); setError(""); }}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(255,154,0,0.12)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.25)" }}>
                      Gestionar escrow
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de gestión */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
               style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="font-bold text-white text-lg mb-1">Gestión de escrow</h3>
              <p className="text-sm mb-1" style={{ color: "#A1A1AA" }}>{selected.assetName}</p>
              <p className="text-xs mb-4" style={{ color: "#6B6358" }}>
                Inversor: {selected.investorName} · USD {selected.amountUSD.toLocaleString()}
              </p>

              <div className="mb-2 text-xs" style={{ color: "#6B6358" }}>Estado actual: <strong style={{ color: EscrowService.getStatusColor(selected.status) }}>{EscrowService.getStatusLabel(selected.status)}</strong></div>

              {validActions.length === 0 ? (
                <div className="p-3 rounded-lg text-xs text-center mb-4"
                     style={{ background: "rgba(255,255,255,0.03)", color: "#6B6358", border: "1px solid rgba(255,255,255,0.06)" }}>
                  No hay transiciones disponibles desde el estado actual.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {validActions.map(a => (
                    <button key={a.value} onClick={() => setNewStatus(a.value)}
                            className="p-2.5 rounded-lg text-xs font-semibold text-left"
                            style={{
                              background: newStatus === a.value ? `${a.color}22` : "rgba(255,255,255,0.03)",
                              border: `1px solid ${newStatus === a.value ? `${a.color}66` : "rgba(255,255,255,0.08)"}`,
                              color: newStatus === a.value ? a.color : "#6B6358",
                            }}>
                      {a.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs mb-2" style={{ color: "#A1A1AA" }}>Nota (opcional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                          placeholder="Notas para el inversor o registro interno..."
                          className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
                          style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>

              {error && <div className="mb-3 p-3 rounded-lg text-xs text-red-400" style={{ background: "rgba(239,68,68,0.1)" }}>{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setSelected(null)}
                        className="flex-1 py-2.5 rounded-lg text-sm"
                        style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#6B6358" }}>
                  Cerrar
                </button>
                <button onClick={handleAction} disabled={!newStatus || processing || validActions.length === 0}
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                        style={{
                          background: newStatus && !processing ? "linear-gradient(135deg, #FF9A00, #D4AF37)" : "#222",
                          color: newStatus && !processing ? "#000" : "#6B6358",
                        }}>
                  {processing ? "Guardando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#FF9A00", borderTopColor: "transparent" }} />
    </div>
  );
}
