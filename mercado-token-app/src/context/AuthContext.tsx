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

const CACHE_KEY = "mt_user_v1";

function loadCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}

function cacheUser(u: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (u) sessionStorage.setItem(CACHE_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

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
  const cached = loadCachedUser();
  const [user, setUser]       = useState<User | null>(cached);
  // Si hay usuario cacheado no mostramos spinner de carga
  const [loading, setLoading] = useState(!cached);

  function setUserAndCache(u: User | null) {
    cacheUser(u);
    setUser(u);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const ref = doc(getFirebaseDb(), "users", firebaseUser.uid);
          let snap;
          try { snap = await getDoc(ref); } catch { snap = null; }

          if (snap && snap.exists()) {
            setUserAndCache({ id: firebaseUser.uid, ...snap.data() } as User);
          } else {
            const fallback = {
              email: firebaseUser.email ?? "",
              name: firebaseUser.email?.split("@")[0] ?? "Usuario",
              role: "inversor" as const,
              mktBalance: 500,
              kycStatus: "pendiente" as const,
              createdAt: new Date(),
            };
            try { await setDoc(ref, { ...fallback, createdAt: serverTimestamp() }); } catch {}
            setUserAndCache({ id: firebaseUser.uid, ...fallback });
          }
        } else {
          // SDK dice que no hay sesión — solo limpiar si tampoco hay cache reciente
          // (evita borrar al usuario que acaba de loguear via REST mientras el SDK aún sincroniza)
          const stillCached = loadCachedUser();
          if (!stillCached) setUserAndCache(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function signIn(email: string, password: string) {
    function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
      return Promise.race([
        promise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
      ]);
    }

    // Paso 1: autenticar via REST (bypass del SDK que se congela en Safari mobile)
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const controller = new AbortController();
    const authTimer = setTimeout(() => controller.abort(), 10000);
    let res: Response;
    try {
      res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
          signal: controller.signal,
        }
      );
    } catch {
      throw new Error("network-error");
    } finally {
      clearTimeout(authTimer);
    }

    const data = await res.json();
    if (!res.ok) {
      const code: string = data?.error?.message ?? "UNKNOWN";
      if (code.includes("INVALID_LOGIN_CREDENTIALS") || code.includes("INVALID_PASSWORD") || code.includes("EMAIL_NOT_FOUND")) {
        throw new Error("invalid-credential");
      }
      if (code.includes("TOO_MANY_ATTEMPTS")) throw new Error("too-many-requests");
      throw new Error(code);
    }

    const uid: string = data.localId;

    // Paso 2: cargar perfil de Firestore con timeout de 5s (si falla usamos fallback)
    const ref = doc(getFirebaseDb(), "users", uid);
    const snap = await withTimeout(getDoc(ref).catch(() => null), 5000);

    const userObj: User = snap && snap.exists()
      ? ({ id: uid, ...snap.data() } as User)
      : {
          id: uid,
          email,
          name: email.split("@")[0],
          role: "inversor" as const,
          mktBalance: 500,
          kycStatus: "pendiente" as const,
          createdAt: new Date(),
        };

    // Guardar en cache ANTES de navegar para que el reload lo encuentre
    setUserAndCache(userObj);

    if (!(snap && snap.exists())) {
      setDoc(ref, { ...userObj, createdAt: serverTimestamp() }).catch(() => {});
    }

    // Sincronizar SDK en background
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
    try { await sendEmailVerification(cred.user); } catch {}
    setUserAndCache({ id: cred.user.uid, ...newUser });
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth());
    setUserAndCache(null);
  }

  async function updateUser(data: Partial<User>) {
    if (!user) return;
    const ref = doc(getFirebaseDb(), "users", user.id);
    await updateDoc(ref, data as Record<string, unknown>);
    setUserAndCache(user ? { ...user, ...data } : null);
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
