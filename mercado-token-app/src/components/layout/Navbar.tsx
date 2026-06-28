"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
         style={{ background: "rgba(10,10,10,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)" }}>
      <Link href="/dashboard" className="flex items-center gap-3">
        <Image src="/logo-brand.png" alt="Mercado Token" width={120} height={40} style={{ objectFit: "contain", height: 36, width: "auto" }} />
      </Link>

      <div className="flex items-center gap-2">
        {user && (
          <>
            <span className="text-sm mr-2" style={{ color: "var(--gold-light)" }}>
              {user.mktBalance.toLocaleString()} MKT
            </span>
            <Link href="/wallet" className="text-sm px-3 py-1.5 rounded-md transition"
                  style={{ color: "#A1A1AA" }}>
              Wallet
            </Link>
            <Link href="/marketplace" className="text-sm px-3 py-1.5 rounded-md transition"
                  style={{ color: "#A1A1AA" }}>
              Marketplace
            </Link>
            {user.role === "emisor" && (
              <Link href="/emisor" className="text-sm px-3 py-1.5 rounded-md"
                    style={{ color: "#A1A1AA" }}>
                Panel Emisor
              </Link>
            )}
            <button onClick={handleSignOut}
                    className="text-sm px-4 py-1.5 rounded-md border transition"
                    style={{ borderColor: "var(--copper)", color: "var(--gold-light)" }}>
              Salir
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
