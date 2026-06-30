import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App | null = null;

export function getFirebaseAdminApp(): App | null {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return app;
}

export function getAdminAuth() {
  const a = getFirebaseAdminApp();
  if (!a) throw new Error("firebase-admin no configurado");
  return getAuth(a);
}

export function getAdminDb() {
  const a = getFirebaseAdminApp();
  if (!a) throw new Error("firebase-admin no configurado");
  return getFirestore(a);
}
