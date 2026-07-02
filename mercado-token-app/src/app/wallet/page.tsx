"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import DashboardFinanciero from "@/components/wallet/DashboardFinanciero";
import WalletMKT           from "@/components/wallet/WalletMKT";
import MiPortafolio        from "@/components/wallet/MiPortafolio";
import MarketplaceAcceso   from "@/components/wallet/MarketplaceAcceso";
import Movimientos         from "@/components/wallet/Movimientos";
import Dividendos          from "@/components/wallet/Dividendos";
import Rewards             from "@/components/wallet/Rewards";
import Staking             from "@/components/wallet/Staking";
import Notificaciones      from "@/components/wallet/Notificaciones";
import CentroFiscal        from "@/components/wallet/CentroFiscal";
import Favoritos           from "@/components/wallet/Favoritos";
import Simulador           from "@/components/wallet/Simulador";
import Estadisticas        from "@/components/wallet/Estadisticas";
import Configuracion       from "@/components/wallet/Configuracion";
import { MOCK_NOTIFICATIONS } from "@/components/wallet/wallet-data";

type SectionId =
  | "dashboard" | "wallet" | "portafolio" | "marketplace"
  | "movimientos" | "dividendos" | "rewards" | "staking"
  | "notificaciones" | "fiscal" | "favoritos" | "simulador"
  | "estadisticas" | "configuracion";

interface NavItem {
  id: SectionId;
  icon: string;
  label: string;
  badge?: number | string;
  soon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard",      icon: "🏛️",  label: "Dashboard"         },
  { id: "wallet",         icon: "💎",  label: "Wallet MKT"        },
  { id: "portafolio",     icon: "📊",  label: "Mi Portafolio"     },
  { id: "marketplace",    icon: "🏪",  label: "Marketplace"       },
  { id: "movimientos",    icon: "📋",  label: "Movimientos"       },
  { id: "dividendos",     icon: "💸",  label: "Dividendos"        },
  { id: "rewards",        icon: "🎁",  label: "Rewards"           },
  { id: "staking",        icon: "🔒",  label: "Staking",     soon: true },
  { id: "notificaciones", icon: "🔔",  label: "Notificaciones"    },
  { id: "fiscal",         icon: "🧾",  label: "Centro Fiscal"     },
  { id: "favoritos",      icon: "⭐",  label: "Favoritos"         },
  { id: "simulador",      icon: "🔮",  label: "Simulador"         },
  { id: "estadisticas",   icon: "📈",  label: "Estadísticas"      },
  { id: "configuracion",  icon: "⚙️",  label: "Configuración"     },
];

const SECTION_TITLE: Record<SectionId, string> = {
  dashboard:      "Dashboard Financiero",
  wallet:         "Wallet MKT",
  portafolio:     "Mi Portafolio",
  marketplace:    "Marketplace",
  movimientos:    "Movimientos",
  dividendos:     "Dividendos",
  rewards:        "Rewards",
  staking:        "Staking",
  notificaciones: "Notificaciones",
  fiscal:         "Centro Fiscal",
  favoritos:      "Favoritos",
  simulador:      "Simulador",
  estadisticas:   "Estadísticas",
  configuracion:  "Configuración",
};

export default function WalletPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<SectionId>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const unreadNotifications = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "#FF9A00", borderTopColor: "transparent" }} />
    </div>
  );

  function navigate(id: SectionId) {
    setActive(id);
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <Navbar />

      <div className="pt-16 max-w-7xl mx-auto px-4 pb-12">
        <div className="flex gap-6 mt-6">

          {/* Sidebar — desktop */}
          <aside className="hidden lg:flex flex-col w-56 flex-shrink-0">
            <div className="sticky top-24">
              <div className="text-xs tracking-widest uppercase mb-4 px-2" style={{ color: "#6B6358" }}>
                Centro Financiero
              </div>
              <nav className="flex flex-col gap-0.5">
                {NAV_ITEMS.map(item => {
                  const isActive = active === item.id;
                  const badge = item.id === "notificaciones" ? unreadNotifications : undefined;
                  return (
                    <button key={item.id} onClick={() => navigate(item.id)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition w-full"
                            style={{
                              background: isActive ? "rgba(255,154,0,0.1)" : "transparent",
                              color:      isActive ? "#FF9A00" : "#6B6358",
                              border:     `1px solid ${isActive ? "rgba(255,154,0,0.25)" : "transparent"}`,
                            }}>
                      <span className="text-base w-5 text-center">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.soon && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(56,189,248,0.1)", color: "#38BDF8", fontSize: "0.6rem" }}>
                          NEW
                        </span>
                      )}
                      {badge != null && badge > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: "#EF4444", color: "white", fontSize: "0.65rem" }}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">

            {/* Header + mobile menu toggle */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-white">{SECTION_TITLE[active]}</h1>
                <p className="text-xs mt-0.5" style={{ color: "#6B6358" }}>Centro Financiero · Mercado Token</p>
              </div>
              {/* Mobile hamburger */}
              <button onClick={() => setMenuOpen(o => !o)}
                      className="lg:hidden p-2 rounded-xl"
                      style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", color: "#A1A1AA" }}>
                ☰
              </button>
            </div>

            {/* Mobile drawer */}
            {menuOpen && (
              <div className="lg:hidden mb-6 p-4 rounded-xl" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="grid grid-cols-2 gap-1">
                  {NAV_ITEMS.map(item => {
                    const isActive = active === item.id;
                    const badge = item.id === "notificaciones" ? unreadNotifications : undefined;
                    return (
                      <button key={item.id} onClick={() => navigate(item.id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left"
                              style={{
                                background: isActive ? "rgba(255,154,0,0.1)" : "transparent",
                                color:      isActive ? "#FF9A00" : "#6B6358",
                              }}>
                        <span>{item.icon}</span>
                        <span className="flex-1 text-xs">{item.label}</span>
                        {badge != null && badge > 0 && (
                          <span className="text-xs w-4 h-4 rounded-full font-bold flex items-center justify-center"
                                style={{ background: "#EF4444", color: "white", fontSize: "0.6rem" }}>
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Secciones */}
            {active === "dashboard"      && <DashboardFinanciero user={user} />}
            {active === "wallet"         && <WalletMKT user={user} />}
            {active === "portafolio"     && <MiPortafolio />}
            {active === "marketplace"    && <MarketplaceAcceso />}
            {active === "movimientos"    && <Movimientos />}
            {active === "dividendos"     && <Dividendos />}
            {active === "rewards"        && <Rewards />}
            {active === "staking"        && <Staking />}
            {active === "notificaciones" && <Notificaciones />}
            {active === "fiscal"         && <CentroFiscal user={user} />}
            {active === "favoritos"      && <Favoritos />}
            {active === "simulador"      && <Simulador />}
            {active === "estadisticas"   && <Estadisticas />}
            {active === "configuracion"  && <Configuracion />}

          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
