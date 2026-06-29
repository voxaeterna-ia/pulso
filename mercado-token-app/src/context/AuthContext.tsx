"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const ref = doc(getFirebaseDb(), "users", firebaseUser.uid);
          let snap;
          try { snap = await getDoc(ref); } catch { snap = null; }

          if (snap && snap.exists()) {
            setUser({ id: firebaseUser.uid, ...snap.data() } as User);
          } else {
            const fallback = {
              email: firebaseUser.email ?? "",
              name: firebaseUser.email?.split("@")[0] ?? "Usuario",
              role: "inversor" as const,
              mktBalance: 500,
              kycStatus: "pendiente" as const,
              createdAt: new Date(),
            };
            try { await setDoc(ref, { ...fallback, createdAt: serverTimestamp() }); } catch { /* reglas pendientes */ }
            setUser({ id: firebaseUser.uid, ...fallback });
          }
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  async function signIn(email: string, password: string) {
    // REST API directa: evita que el SDK cuelgue en Safari mobile (IndexedDB / cola interna)
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      const code: string = data?.error?.message ?? "UNKNOWN";
      if (code.includes("INVALID_LOGIN_CREDENTIALS") || code.includes("INVALID_PASSWORD") || code.includes("EMAIL_NOT_FOUND")) {
        throw new Error("invalid-credential");
      }
      if (code.includes("TOO_MANY_ATTEMPTS")) {
        throw new Error("too-many-requests");
      }
      throw new Error(code);
    }

    // Cargamos datos del usuario directamente de Firestore con el uid recibido
    const uid: string = data.localId;
    const ref = doc(getFirebaseDb(), "users", uid);
    let snap;
    try { snap = await getDoc(ref); } catch { snap = null; }

    if (snap && snap.exists()) {
      setUser({ id: uid, ...snap.data() } as User);
    } else {
      const fallback = {
        email,
        name: email.split("@")[0],
        role: "inversor" as const,
        mktBalance: 500,
        kycStatus: "pendiente" as const,
        createdAt: new Date(),
      };
      try { await setDoc(ref, { ...fallback, createdAt: serverTimestamp() }); } catch { /* reglas pendientes */ }
      setUser({ id: uid, ...fallback });
    }

    // En segundo plano sincronizamos el SDK (para que onAuthStateChanged funcione luego)
    signInWithEmailAndPassword(getFirebaseAuth(), email, password).catch(() => {});
  }

  async function signUp(email: string, password: string, name: string, role: UserRole) {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    const newUser: Omit<User, "id"> = {
      email,
      name,
      role,
      mktBalance: role === "inversor" ? 500 : 0,
      kycStatus: "pendiente",
      createdAt: new Date(),
    };
    await setDoc(doc(getFirebaseDb(), "users", cred.user.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
    });
    try { await sendEmailVerification(cred.user); } catch { /* no bloquea el registro */ }
    setUser({ id: cred.user.uid, ...newUser });
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth());
    setUser(null);
  }

  async function updateUser(data: Partial<User>) {
    if (!user) return;
    const ref = doc(getFirebaseDb(), "users", user.id);
    await updateDoc(ref, data as Record<string, unknown>);
    setUser(prev => prev ? { ...prev, ...data } : prev);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
