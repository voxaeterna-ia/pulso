"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
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
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
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
    setUser({ id: cred.user.uid, ...newUser });
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth());
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
