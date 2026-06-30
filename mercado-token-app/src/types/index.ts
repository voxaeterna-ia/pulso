// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = "inversor" | "emisor" | "admin" | "invitado";

// ─── Usuario ──────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mktBalance: number;
  kycStatus: "pendiente" | "en_revision" | "aprobado" | "rechazado";
  kycValidatedAt?: string; // ISO date — solo el resultado, nunca datos extraídos del documento
  createdAt: Date;
  phone?: string;
  country?: string;
  avatarUrl?: string;
}

export interface IssuerProfile {
  userId: string;
  companyName?: string;
  taxId?: string;
  website?: string;
  description?: string;
  verifiedAt?: Date;
  status: "pendiente" | "verificado" | "suspendido";
}

export interface InvestorProfile {
  userId: string;
  riskProfile?: "conservador" | "moderado" | "agresivo";
  totalInvested: number;
  totalOperations: number;
  kycCompletedAt?: Date;
}

// ─── Verificación de identidad (KYC) ─────────────────────────────────────────
// Datos personales declarados por el usuario, a contrastar contra el
// contenido del documento mediante validación por IA (no se persisten
// las imágenes crudas; solo el resultado de la validación).
export interface KycPersonalData {
  nombres: string;
  apellidos: string;
  fechaNacimiento: string; // ISO date (yyyy-mm-dd)
  docType: "DNI" | "Pasaporte" | "Cédula";
  docNumber: string;
}

export type KycCheckResult = "ok" | "no_coincide" | "no_legible" | "no_detectado";

export interface KycValidationResult {
  documentoCoincide: KycCheckResult;
  numeroCoincideFrenteDorso: KycCheckResult;
  rostroDetectado: KycCheckResult;
  anteojosOMascaraDetectado: boolean;
  aprobado: boolean;
  motivo?: string;
  validatedAt: Date;
}

// ─── Sectores / Tipos de activo ───────────────────────────────────────────────
export type AssetType =
  | "real-estate"
  | "startups"
  | "energia"
  | "commodities"
  | "arte"
  | "turismo"
  | "ambiental"
  | "infraestructura"
  | "agro"
  | "ip";

// ─── Estados del activo ───────────────────────────────────────────────────────
export type AssetStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_changes"
  | "approved"
  | "rejected"
  | "listed"
  | "paused"
  | "funded"
  | "closed";

// ─── Activo (base) ────────────────────────────────────────────────────────────
export interface Asset {
  id: string;
  issuerId: string;
  issuerName: string;

  // Identificación
  name: string;
  assetType: AssetType;
  shortDescription: string;
  fullDescription: string;

  // Ubicación
  country: string;
  state: string;
  city: string;
  address?: string;

  // Economía
  estimatedValue: number;
  tokenizationAmount: number;
  estimatedTokenCount: number;
  tokenPrice: number;
  currency: "USD" | "ARS" | "EUR";
  expectedReturn?: string;
  projectHorizon?: string;

  // Progreso de financiamiento
  tokensTotal: number;
  tokensAvailable: number;
  fundedPercent: number;

  // Metadata
  risks?: string;
  status: AssetStatus;
  adminReviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
  listedAt?: Date;

  // Media (URLs simuladas)
  mainImageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;

  // Documentos
  legalDocUrl?: string;
  technicalDocUrl?: string;
}

// ─── Campos específicos Real Estate ──────────────────────────────────────────
export interface RealEstateAsset extends Asset {
  assetType: "real-estate";
  propertyType?: string;
  totalSqm?: number;
  coveredSqm?: number;
  rooms?: number;
  bathrooms?: number;
  constructionStatus?: string;
  constructionYear?: number;
  amenities?: string;
  currentRent?: number;
  projectedRent?: number;
  estimatedExpenses?: number;
  occupancyStatus?: string;
  titleDocUrl?: string;
  blueprintsDocUrl?: string;
}

// ─── Revisión admin ───────────────────────────────────────────────────────────
export interface AdminReview {
  id: string;
  assetId: string;
  adminId: string;
  adminName: string;
  action: "approved" | "rejected" | "needs_changes" | "listed";
  note?: string;
  createdAt: Date;
}

// ─── Estados de transacción / intención de inversión ─────────────────────────
export type InvestmentStatus =
  | "initiated"
  | "pending_review"
  | "payment_pending"
  | "funds_held"
  | "approved"
  | "released"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed";

// ─── Intención de inversión ───────────────────────────────────────────────────
export interface InvestmentIntention {
  id: string;
  investorId: string;
  investorName: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;

  amountUSD: number;
  estimatedTokens: number;
  tokenPrice: number;

  status: InvestmentStatus;
  statusHistory: StatusHistoryEntry[];

  escrowOperationId?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface StatusHistoryEntry {
  status: InvestmentStatus;
  changedAt: Date;
  changedBy: string;
  note?: string;
}

// ─── Operación Escrow ─────────────────────────────────────────────────────────
export type EscrowStatus =
  | "created"
  | "funds_received"
  | "funds_held"
  | "approved"
  | "released"
  | "refunded"
  | "disputed"
  | "cancelled";

export interface EscrowOperation {
  id: string;
  intentionId: string;
  investorId: string;
  issuerId: string;
  assetId: string;
  amountUSD: number;
  status: EscrowStatus;
  heldAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Transacción ──────────────────────────────────────────────────────────────
export type TransactionType =
  | "investment_initiated"
  | "funds_held"
  | "funds_released"
  | "funds_refunded"
  | "reward"
  | "deposit"
  | "withdrawal";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountUSD: number;
  currency: "USD" | "ARS" | "MKT";
  description: string;
  relatedAssetId?: string;
  relatedIntentionId?: string;
  status: "completed" | "pending" | "failed";
  createdAt: Date;
}

// ─── Notificación ─────────────────────────────────────────────────────────────
export type NotificationType =
  | "investment_status"
  | "asset_status"
  | "kyc_update"
  | "admin_message"
  | "general";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

// ─── Wallet (preparada para futuro) ──────────────────────────────────────────
export interface Wallet {
  id: string;
  userId: string;
  balanceUSD: number;
  balanceMKT: number;
  balanceARS: number;
  walletAddress?: string;     // future: blockchain
  custodyProvider?: string;   // future: custody
  createdAt: Date;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: "user" | "asset" | "intention" | "escrow" | "transaction";
  entityId: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

// ─── Legacy (compatibilidad pantallas anteriores) ─────────────────────────────
export interface Investment {
  id: string;
  userId: string;
  assetId: string;
  assetName: string;
  tokens: number;
  totalInvested: number;
  date: Date;
  status: "activo" | "pendiente" | "completado";
}
