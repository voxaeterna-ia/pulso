"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";

const MOCK_TRANSACTIONS = [
  { id: "1", type: "reward",   amount: 500,  currency: "MKT", description: "Bono de bienvenida",            date: "2025-06-01", status: "completado" },
  { id: "2", type: "deposito", amount: 2000, currency: "MKT", description: "Depósito inicial",              date: "2025-06-05", status: "completado" },
  { id: "3", type: "compra",   amount: 250,  currency: "MKT", description: "Tokens — Torre Catalinas Norte", date: "2025-06-10", status: "completado" },
  { id: "4", type: "reward",   amount: 50,   currency: "MKT", description: "Reward — staking mensual",      date: "2025-06-15", status: "completado" },
  { id: "5", type: "compra",   amount: 100,  currency: "MKT", description: "Tokens — Parque Solar Mendoza",  date: "2025-06-20", status: "pendiente"  },
];

const TX_ICON: Record<string, string>  = { compra: "📤", venta: "📥", deposito: "⬇️", retiro: "⬆️", reward: "🎁" };
const TX_COLOR: Record<string, string> = { compra: "#EF4444", venta: "#10B981", deposito: "#10B981", retiro: "#EF4444", reward: "#F59E0B" };
const TX_SIGN: Record<string, string>  = { compra: "−", venta: "+", deposito: "+", retiro: "−", reward: "+" };

export default function WalletPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />
      <main className="pt-20 px-4 pb-12 max-w-3xl mx-auto">
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Wallet MKT</h1>
          <p style={{ color: "#A1A1AA", fontSize: "0.9rem" }}>Tu balance y movimientos en el ecosistema</p>
        </div>

        {/* Balance card */}
        <div className="p-6 rounded-2xl mb-6 relative overflow-hidden"
             style={{ background: "linear-gradient(135deg, #1A1200, #111111)", border: "1px solid rgba(212,175,55,0.3)" }}>
          <div className="absolute inset-0 opacity-5"
               style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #FF9A00 0%, transparent 60%)" }} />
          <div className="flex items-center gap-4 relative">
            <Image src="/logo-mkt.jpg" alt="MKT Token" width={64} height={64}
                   style={{ borderRadius: "50%", objectFit: "cover" }} />
            <div>
              <div className="text-xs mb-1" style={{ color: "#6B6358", letterSpacing: "0.08em", textTransform: "uppercase" }}>Balance disponible</div>
              <div className="text-3xl font-bold" style={{ color: "var(--gold-light)" }}>
                {user.mktBalance.toLocaleString()} <span className="text-lg" style={{ color: "var(--copper)" }}>MKT</span>
              </div>
              <div className="text-sm mt-1" style={{ color: "#6B6358" }}>
                ≈ USD {(user.mktBalance * 0.1).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: "⬇️", label: "Depositar" },
            { icon: "⬆️", label: "Retirar"   },
            { icon: "🔄", label: "Convertir"  },
          ].map(a => (
            <button key={a.label}
                    onClick={() => alert(`Función "${a.label}" disponible próximamente.`)}
                    className="py-3 rounded-xl text-sm font-semibold transition hover:border-orange-500/40"
                    style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", color: "#A1A1AA" }}>
              <div className="text-xl mb-1">{a.icon}</div>
              {a.label}
            </button>
          ))}
        </div>

        {/* Historial */}
        <h2 className="font-bold text-white mb-4">Historial de movimientos</h2>
        <div className="flex flex-col gap-2">
          {MOCK_TRANSACTIONS.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl"
                 style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3">
                <div className="text-xl">{TX_ICON[tx.type]}</div>
                <div>
                  <div className="text-sm font-semibold text-white">{tx.description}</div>
                  <div className="text-xs" style={{ color: "#6B6358" }}>
                    {tx.date} · <span className="capitalize">{tx.status}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold" style={{ color: TX_COLOR[tx.type] }}>
                {TX_SIGN[tx.type]}{tx.amount.toLocaleString()} {tx.currency}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
