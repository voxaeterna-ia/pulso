"use client";
import { useState } from "react";
import { MOCK_NOTIFICATIONS } from "./wallet-data";

const TYPE_ICON:  Record<string, string> = { dividendo: "💸", inversion: "📊", kyc: "🪪", sistema: "🔔", mercado: "🏪" };
const TYPE_COLOR: Record<string, string> = { dividendo: "#A78BFA", inversion: "#10B981", kyc: "#F59E0B", sistema: "#6B6358", mercado: "#FF9A00" };

export default function Notificaciones() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unread = notifications.filter(n => !n.read).length;

  function markAll() {
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
              {unread} nuevas
            </span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="text-xs" style={{ color: "#FF9A00" }}>
            Marcar todo como leído
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id}
               onClick={() => setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
               className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition"
               style={{
                 background: n.read ? "#111111" : "rgba(255,154,0,0.04)",
                 border: `1px solid ${n.read ? "rgba(255,255,255,0.07)" : "rgba(255,154,0,0.2)"}`,
               }}>
            <span className="text-xl mt-0.5">{TYPE_ICON[n.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-sm text-white truncate">{n.title}</div>
                {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#FF9A00" }} />}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#A1A1AA" }}>{n.message}</div>
              <div className="text-xs mt-1" style={{ color: "#52525B" }}>{n.date}</div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12" style={{ color: "#6B6358" }}>
          <div className="text-4xl mb-3">🔔</div>
          <div>Sin notificaciones</div>
        </div>
      )}
    </div>
  );
}
