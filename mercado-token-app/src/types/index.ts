export type UserRole = "inversor" | "emisor" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mktBalance: number;
  kycStatus: "pendiente" | "en_revision" | "aprobado" | "rechazado";
  createdAt: Date;
}

export interface Asset {
  id: string;
  name: string;
  sector: string;
  location: string;
  totalValue: number;
  tokenPrice: number;
  tokensAvailable: number;
  tokensTotal: number;
  expectedReturn: string;
  term: string;
  status: "activo" | "preventa" | "cerrado" | "pausado";
  description: string;
  image?: string;
}

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

export interface Transaction {
  id: string;
  userId: string;
  type: "compra" | "venta" | "deposito" | "retiro" | "reward";
  amount: number;
  currency: "MKT" | "USD" | "ARS";
  description: string;
  date: Date;
  status: "completado" | "pendiente" | "fallido";
}
