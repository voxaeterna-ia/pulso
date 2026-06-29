import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
    // localStorage funciona en todos los browsers incluyendo Safari mobile
    // IndexedDB (default) puede bloquearse en Safari causando login infinito
    setPersistence(_auth, browserLocalPersistence).catch(() => {});
  }
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}

// Lazy exports — safe for SSR/static build
export const auth = typeof window !== "undefined" ? getFirebaseAuth() : (null as unknown as Auth);
export const db   = typeof window !== "undefined" ? getFirebaseDb()   : (null as unknown as Firestore);

export default getFirebaseApp;
