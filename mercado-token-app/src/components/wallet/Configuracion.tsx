"use client";
import { useState } from "react";

export default function Configuracion() {
  const [moneda, setMoneda]   = useState("USD");
  const [idioma, setIdioma]   = useState("es");
  const [notifEmail, setNotifEmail]   = useState(true);
  const [notifPush, setNotifPush]     = useState(true);
  const [notifDividendos, setNotifDividendos] = useState(true);
  const [notifMercado, setNotifMercado]       = useState(false);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
            className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
            style={{ background: value ? "#FF9A00" : "#374151" }}>
      <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all"
           style={{ left: value ? "calc(100% - 20px)" : "4px" }} />
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Preferencias */}
      <div className="p-5 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="font-bold text-white mb-4 text-sm">Preferencias</div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Moneda de visualización</div>
              <div className="text-xs" style={{ color: "#6B6358" }}>Moneda usada en todos los cálculos</div>
            </div>
            <select value={moneda} onChange={e => setMoneda(e.target.value)}
                    className="text-sm px-3 py-1.5 rounded-lg"
                    style={{ background: "#0A0A0A", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Idioma</div>
              <div className="text-xs" style={{ color: "#6B6358" }}>Idioma de la interfaz</div>
            </div>
            <select value={idioma} onChange={e => setIdioma(e.target.value)}
                    className="text-sm px-3 py-1.5 rounded-lg"
                    style={{ background: "#0A0A0A", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="p-5 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="font-bold text-white mb-4 text-sm">Notificaciones</div>
        <div className="flex flex-col gap-4">
          {[
            { label: "Notificaciones por email",    sub: "Recibí resúmenes en tu correo",           value: notifEmail,      set: setNotifEmail      },
            { label: "Notificaciones push",          sub: "Alertas en tiempo real en el navegador",  value: notifPush,       set: setNotifPush       },
            { label: "Alertas de dividendos",        sub: "Cuando se acredita un pago",              value: notifDividendos, set: setNotifDividendos },
            { label: "Alertas del marketplace",      sub: "Nuevos activos disponibles",              value: notifMercado,    set: setNotifMercado    },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-white">{item.label}</div>
                <div className="text-xs" style={{ color: "#6B6358" }}>{item.sub}</div>
              </div>
              <Toggle value={item.value} onChange={item.set} />
            </div>
          ))}
        </div>
      </div>

      {/* Seguridad */}
      <div className="p-5 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="font-bold text-white mb-4 text-sm">Seguridad</div>
        <div className="flex flex-col gap-2">
          {[
            { icon: "🔐", label: "Autenticación en 2 pasos",    estado: "Próximamente" },
            { icon: "🔑", label: "Cambiar contraseña",           estado: "Próximamente" },
            { icon: "📱", label: "Dispositivos conectados",      estado: "Próximamente" },
            { icon: "📋", label: "Historial de accesos",         estado: "Próximamente" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg"
                 style={{ background: "#0A0A0A" }}>
              <div className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span className="text-sm text-white">{item.label}</span>
              </div>
              <span className="text-xs" style={{ color: "#52525B" }}>{item.estado}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-center" style={{ color: "#52525B" }}>
        Las preferencias se guardan localmente. La sincronización en la nube estará disponible próximamente.
      </div>
    </div>
  );
}
