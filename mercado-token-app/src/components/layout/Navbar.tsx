"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const investorLinks = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/inversiones", label: "Mis inversiones" },
    { href: "/wallet", label: "Wallet" },
    { href: "/perfil", label: "Perfil" },
  ];

  const emisorLinks = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/emisor/activos", label: "Mis activos" },
    { href: "/emisor/nuevo-activo", label: "+ Nuevo activo" },
    { href: "/perfil", label: "Perfil" },
  ];

  const adminLinks = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/admin/activos", label: "Validar activos" },
    { href: "/admin/inversiones", label: "Operaciones" },
    { href: "/marketplace", label: "Marketplace" },
  ];

  const links =
    user?.role === "admin" ? adminLinks :
    user?.role === "emisor" ? emisorLinks :
    investorLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
         style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <Image src="/logo-brand.png" alt="Mercado Token" width={120} height={40}
                 style={{ height: 34, width: "auto", mixBlendMode: "screen" }} />
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                    className="px-3 py-1.5 rounded-lg text-sm transition"
                    style={{
                      color: pathname === l.href ? "#FF9A00" : "#A1A1AA",
                      background: pathname === l.href ? "rgba(255,154,0,0.1)" : "transparent",
                      textDecoration: "none",
                    }}>
                {l.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden md:block text-xs px-2 py-1 rounded-full"
                    style={{ background: "rgba(255,154,0,0.1)", color: "#FF9A00", border: "1px solid rgba(255,154,0,0.2)" }}>
                {user.role === "admin" ? "Admin" : user.role === "emisor" ? "Emisor" : "Inversor"}
              </span>
              <button onClick={handleSignOut}
                      className="text-xs px-3 py-1.5 rounded-lg transition"
                      style={{ color: "#6B6358", border: "1px solid rgba(255,255,255,0.08)" }}>
                Salir
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #FF9A00, #D4AF37)", color: "#000", textDecoration: "none", fontWeight: 600 }}>
              Ingresar
            </Link>
          )}

          {user && (
            <button className="md:hidden p-2" onClick={() => setMenuOpen(o => !o)}
                    style={{ color: "#A1A1AA" }}>
              ☰
            </button>
          )}
        </div>
      </div>

      {menuOpen && user && (
        <div className="md:hidden mt-2 pb-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm"
                  style={{ color: pathname === l.href ? "#FF9A00" : "#A1A1AA", textDecoration: "none" }}>
              {l.label}
            </Link>
          ))}
          <button onClick={handleSignOut} className="block w-full text-left px-4 py-2.5 text-sm"
                  style={{ color: "#6B6358" }}>
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
}
