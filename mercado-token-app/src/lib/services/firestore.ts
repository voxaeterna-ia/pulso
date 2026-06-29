import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import {
  Asset,
  InvestmentIntention,
  InvestmentStatus,
  EscrowOperation,
  Transaction,
  Notification,
  AuditLog,
  UserRole,
} from "@/types";
import { EscrowService } from "./escrow";

function db() { return getFirebaseDb(); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date(v as string);
}

function fromFirestore<T>(snap: { id: string; data: () => Record<string, unknown> }): T {
  const data = snap.data();
  return { id: snap.id, ...data } as T;
}

// ─── Assets ───────────────────────────────────────────────────────────────────
export async function createAsset(asset: Omit<Asset, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db(), "assets"), {
    ...asset,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAsset(id: string, data: Partial<Asset>): Promise<void> {
  await updateDoc(doc(db(), "assets", id), { ...data, updatedAt: serverTimestamp() });
}

export async function getAsset(id: string): Promise<Asset | null> {
  const snap = await getDoc(doc(db(), "assets", id));
  if (!snap.exists()) return null;
  return fromFirestore<Asset>(snap);
}

export async function getListedAssets(): Promise<Asset[]> {
  const q = query(collection(db(), "assets"), where("status", "==", "listed"), orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => fromFirestore<Asset>(d));
}

export async function getAssetsByIssuer(issuerId: string): Promise<Asset[]> {
  const q = query(collection(db(), "assets"), where("issuerId", "==", issuerId), orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => fromFirestore<Asset>(d));
}

export async function getAssetsForAdmin(): Promise<Asset[]> {
  const q = query(collection(db(), "assets"), orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => fromFirestore<Asset>(d));
}

// ─── Investment Intentions ────────────────────────────────────────────────────
export async function createIntention(
  intention: Omit<InvestmentIntention, "id" | "statusHistory" | "createdAt" | "updatedAt">
): Promise<string> {
  const statusEntry = EscrowService.buildStatusEntry("initiated", intention.investorId);
  const ref = await addDoc(collection(db(), "investmentIntentions"), {
    ...intention,
    status: "initiated" as InvestmentStatus,
    statusHistory: [statusEntry],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addTransaction({
    userId: intention.investorId,
    type: "investment_initiated",
    amountUSD: intention.amountUSD,
    currency: "USD",
    description: `Intención de inversión en ${intention.assetName}`,
    relatedAssetId: intention.assetId,
    relatedIntentionId: ref.id,
    status: "pending",
  });

  await addNotification({
    userId: intention.investorId,
    type: "investment_status",
    title: "Intención registrada",
    message: `Tu intención de inversión en "${intention.assetName}" fue recibida y está siendo revisada.`,
    read: false,
    link: `/inversiones/${ref.id}`,
  });

  await addAuditLog({
    actorId: intention.investorId,
    actorRole: "inversor",
    action: "investment_intention_created",
    entityType: "intention",
    entityId: ref.id,
    details: { assetId: intention.assetId, amountUSD: intention.amountUSD },
  });

  return ref.id;
}

export async function updateIntentionStatus(
  id: string,
  newStatus: InvestmentStatus,
  changedBy: string,
  note?: string
): Promise<void> {
  const snap = await getDoc(doc(db(), "investmentIntentions", id));
  if (!snap.exists()) throw new Error("Intención no encontrada");

  const data = snap.data() as InvestmentIntention;
  if (!EscrowService.canTransitionIntention(data.status, newStatus)) {
    throw new Error(`Transición inválida: ${data.status} → ${newStatus}`);
  }

  const entry = EscrowService.buildStatusEntry(newStatus, changedBy, note);
  const statusHistory = [...(data.statusHistory || []), entry];

  await updateDoc(doc(db(), "investmentIntentions", id), {
    status: newStatus,
    statusHistory,
    updatedAt: serverTimestamp(),
  });
}

export async function getIntentionsByInvestor(investorId: string): Promise<InvestmentIntention[]> {
  const q = query(
    collection(db(), "investmentIntentions"),
    where("investorId", "==", investorId),
    orderBy("createdAt", "desc")
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(d => fromFirestore<InvestmentIntention>(d));
}

export async function getAllIntentions(): Promise<InvestmentIntention[]> {
  const q = query(collection(db(), "investmentIntentions"), orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  return snaps.docs.map(d => fromFirestore<InvestmentIntention>(d));
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export async function addTransaction(
  tx: Omit<Transaction, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db(), "transactions"), {
    ...tx,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTransactionsByUser(userId: string): Promise<Transaction[]> {
  const q = query(
    collection(db(), "transactions"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(d => fromFirestore<Transaction>(d));
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function addNotification(
  n: Omit<Notification, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(db(), "notifications"), {
    ...n,
    createdAt: serverTimestamp(),
  });
}

export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db(), "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snaps = await getDocs(q);
  return snaps.docs.map(d => fromFirestore<Notification>(d));
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db(), "notifications", id), { read: true });
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export async function addAuditLog(
  log: Omit<AuditLog, "id" | "createdAt">
): Promise<void> {
  await addDoc(collection(db(), "auditLogs"), {
    ...log,
    createdAt: serverTimestamp(),
  });
}
