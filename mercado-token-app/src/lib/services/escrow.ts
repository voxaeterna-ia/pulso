import {
  EscrowOperation,
  EscrowStatus,
  InvestmentIntention,
  InvestmentStatus,
  StatusHistoryEntry,
} from "@/types";

// ─── Transiciones válidas de estado ───────────────────────────────────────────
const INTENTION_TRANSITIONS: Record<InvestmentStatus, InvestmentStatus[]> = {
  initiated:       ["pending_review", "cancelled"],
  pending_review:  ["payment_pending", "cancelled"],
  payment_pending: ["funds_held", "cancelled"],
  funds_held:      ["approved", "disputed", "refunded"],
  approved:        ["released"],
  released:        ["completed"],
  completed:       [],
  cancelled:       [],
  refunded:        [],
  disputed:        ["refunded", "approved"],
};

const ESCROW_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  created:        ["funds_received", "cancelled"],
  funds_received: ["funds_held"],
  funds_held:     ["approved", "disputed", "refunded"],
  approved:       ["released"],
  released:       [],
  refunded:       [],
  disputed:       ["refunded", "approved"],
  cancelled:      [],
};

// ─── EscrowService ────────────────────────────────────────────────────────────
export class EscrowService {
  static canTransitionIntention(from: InvestmentStatus, to: InvestmentStatus): boolean {
    return INTENTION_TRANSITIONS[from]?.includes(to) ?? false;
  }

  static canTransitionEscrow(from: EscrowStatus, to: EscrowStatus): boolean {
    return ESCROW_TRANSITIONS[from]?.includes(to) ?? false;
  }

  static buildStatusEntry(
    status: InvestmentStatus,
    changedBy: string,
    note?: string
  ): StatusHistoryEntry {
    return { status, changedAt: new Date(), changedBy, note };
  }

  static getStatusLabel(status: InvestmentStatus): string {
    const labels: Record<InvestmentStatus, string> = {
      initiated:       "Iniciada",
      pending_review:  "En revisión",
      payment_pending: "Pago pendiente",
      funds_held:      "Fondos retenidos",
      approved:        "Aprobada",
      released:        "Fondos liberados",
      completed:       "Completada",
      cancelled:       "Cancelada",
      refunded:        "Reembolsada",
      disputed:        "En disputa",
    };
    return labels[status] ?? status;
  }

  static getStatusColor(status: InvestmentStatus): string {
    const colors: Record<InvestmentStatus, string> = {
      initiated:       "#A1A1AA",
      pending_review:  "#3B82F6",
      payment_pending: "#F59E0B",
      funds_held:      "#8B5CF6",
      approved:        "#10B981",
      released:        "#10B981",
      completed:       "#10B981",
      cancelled:       "#EF4444",
      refunded:        "#F59E0B",
      disputed:        "#EF4444",
    };
    return colors[status] ?? "#A1A1AA";
  }

  static getEscrowStatusLabel(status: EscrowStatus): string {
    const labels: Record<EscrowStatus, string> = {
      created:        "Creada",
      funds_received: "Fondos recibidos",
      funds_held:     "Fondos retenidos",
      approved:       "Aprobada",
      released:       "Liberada",
      refunded:       "Reembolsada",
      disputed:       "En disputa",
      cancelled:      "Cancelada",
    };
    return labels[status] ?? status;
  }

  // Simula la creación de una operación escrow para una intención
  static createEscrowOperation(
    intention: Omit<InvestmentIntention, "id" | "statusHistory" | "createdAt" | "updatedAt">,
    operationId: string
  ): Omit<EscrowOperation, "id"> {
    return {
      intentionId: operationId,
      investorId: intention.investorId,
      issuerId: "",
      assetId: intention.assetId,
      amountUSD: intention.amountUSD,
      status: "created",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// ─── Etiquetas de estado del activo ──────────────────────────────────────────
export const ASSET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:         { label: "Borrador",       color: "#6B7280" },
  submitted:     { label: "Enviado",        color: "#3B82F6" },
  under_review:  { label: "En revisión",    color: "#F59E0B" },
  needs_changes: { label: "Requiere cambios", color: "#EF4444" },
  approved:      { label: "Aprobado",       color: "#10B981" },
  rejected:      { label: "Rechazado",      color: "#EF4444" },
  listed:        { label: "Publicado",      color: "#10B981" },
  paused:        { label: "Pausado",        color: "#F59E0B" },
  funded:        { label: "Financiado",     color: "#8B5CF6" },
  closed:        { label: "Cerrado",        color: "#6B7280" },
};
