"use client";
import { MOCK_REWARDS } from "./wallet-data";

const TYPE_ICON:  Record<string, string> = { bienvenida: "🎉", referido: "👥", staking: "🔒", fidelidad: "⭐", cashback: "💳" };
const TYPE_LABEL: Record<string, string> = { bienvenida: "Bienvenida", referido: "Referido", staking: "Staking", fidelidad: "Fidelidad", cashback: "Cashback" };
const TYPE_COLOR: Record<string, string> = { bienvenida: "#F59E0B", referido: "#10B981", staking: "#38BDF8", fidelidad: "#A78BFA", cashback: "#FF9A00" };

export default function Rewards() {
  const total = MOCK_REWARDS.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      {/* Total */}
      <div className="p-5 rounded-xl mb-6 text-center relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #1A1200, #111111)", border: "1px solid rgba(245,158,11,0.3)" }}>
        <div className="absolute inset-0 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 50% 100%, rgba(245,158,11,0.1) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="text-3xl mb-2">🎁</div>
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "#6B6358" }}>Rewards acumulados</div>
          <div className="text-3xl font-bold" style={{ color: "#F59E0B" }}>{total} MKT</div>
          <div className="text-sm mt-1" style={{ color: "#6B6358" }}>≈ USD {total.toFixed(2)}</div>
        </div>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2 mb-6">
        {MOCK_REWARDS.map(r => (
          <div key={r.id} className="flex items-center justify-between p-4 rounded-xl"
               style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{TYPE_ICON[r.type]}</span>
              <div>
                <div className="text-sm font-semibold text-white">{r.description}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: TYPE_COLOR[r.type] + "20", color: TYPE_COLOR[r.type] }}>
                    {TYPE_LABEL[r.type]}
                  </span>
                  <span className="text-xs" style={{ color: "#6B6358" }}>{r.date}</span>
                </div>
              </div>
            </div>
            <div className="font-bold text-sm" style={{ color: "#F59E0B" }}>+{r.amount} MKT</div>
          </div>
        ))}
      </div>

      {/* Próximos rewards */}
      <div className="p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <div className="text-sm font-semibold mb-3" style={{ color: "#F59E0B" }}>Cómo ganar más rewards</div>
        <div className="flex flex-col gap-2">
          {[
            { icon: "👥", label: "Referidos",       desc: "Invitá a un amigo y ambos reciben 100 MKT",  estado: "Próximamente" },
            { icon: "🔒", label: "Staking",          desc: "Bloqueá MKT y ganá recompensas mensuales",   estado: "Próximamente" },
            { icon: "⭐", label: "Fidelidad",        desc: "Bonificación por permanencia en la plataforma", estado: "Próximamente" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#0A0A0A" }}>
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <div className="text-xs font-semibold text-white">{item.label}</div>
                <div className="text-xs" style={{ color: "#6B6358" }}>{item.desc}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#52525B" }}>
                {item.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
