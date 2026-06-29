"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role === "admin")   { router.push("/dashboard/admin");    return; }
    if (user.role === "emisor")  { router.push("/dashboard/emisor");   return; }
    router.push("/dashboard/inversor");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
           style={{ borderColor: "#FF9A00", borderTopColor: "transparent" }} />
    </div>
  );
}
