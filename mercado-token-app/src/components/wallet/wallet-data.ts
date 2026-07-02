// Datos mock centralizados del Centro Financiero
// Reemplazar con integraciones reales de blockchain/API cuando estén disponibles

export const MKT_PRICE_USD = 1; // 1 MKT = 1 USD

export interface WalletTransaction {
  id: string;
  type: "compra" | "venta" | "deposito" | "retiro" | "reward" | "dividendo" | "staking";
  amount: number;
  currency: string;
  description: string;
  date: string;
  status: "completado" | "pendiente" | "procesando";
  comprobante?: string;
}

export interface PortfolioAsset {
  id: string;
  name: string;
  type: string;
  icon: string;
  tokensOwned: number;
  tokenPrice: number;
  currentValue: number;
  purchaseValue: number;
  returnPct: number;
  nextDividend?: string;
  nextDividendAmount?: number;
  status: "activo" | "liquidado" | "en_revision";
}

export interface Dividend {
  id: string;
  assetName: string;
  amount: number;
  currency: string;
  date: string;
  status: "pagado" | "pendiente" | "programado";
}

export interface Reward {
  id: string;
  type: "bienvenida" | "referido" | "staking" | "fidelidad" | "cashback";
  description: string;
  amount: number;
  date: string;
  expiry?: string;
}

export interface Notification {
  id: string;
  type: "dividendo" | "inversion" | "kyc" | "sistema" | "mercado";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface FavoriteAsset {
  id: string;
  name: string;
  type: string;
  icon: string;
  tokenPrice: number;
  expectedReturn: string;
  fundedPercent: number;
}

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: "1", type: "reward",    amount: 500,  currency: "MKT", description: "Bono de bienvenida",             date: "2025-06-01", status: "completado" },
  { id: "2", type: "deposito",  amount: 2000, currency: "MKT", description: "Depósito inicial",               date: "2025-06-05", status: "completado" },
  { id: "3", type: "compra",    amount: 250,  currency: "MKT", description: "Tokens — Torre Catalinas Norte",  date: "2025-06-10", status: "completado" },
  { id: "4", type: "reward",    amount: 50,   currency: "MKT", description: "Reward — staking mensual",       date: "2025-06-15", status: "completado" },
  { id: "5", type: "compra",    amount: 100,  currency: "MKT", description: "Tokens — Parque Solar Mendoza",   date: "2025-06-20", status: "pendiente"  },
  { id: "6", type: "dividendo", amount: 38,   currency: "MKT", description: "Dividendo — Torre Catalinas",    date: "2025-07-01", status: "completado" },
  { id: "7", type: "deposito",  amount: 500,  currency: "MKT", description: "Depósito desde cuenta bancaria", date: "2025-07-10", status: "completado" },
];

export const MOCK_PORTFOLIO: PortfolioAsset[] = [
  {
    id: "a1", name: "Torre Catalinas Norte", type: "Inmueble comercial", icon: "🏢",
    tokensOwned: 25, tokenPrice: 10, currentValue: 287.50, purchaseValue: 250,
    returnPct: 15, nextDividend: "2025-08-01", nextDividendAmount: 42, status: "activo",
  },
  {
    id: "a2", name: "Parque Solar Mendoza", type: "Energía renovable", icon: "☀️",
    tokensOwned: 10, tokenPrice: 10, currentValue: 104, purchaseValue: 100,
    returnPct: 4, nextDividend: "2025-08-15", nextDividendAmount: 18, status: "activo",
  },
];

export const MOCK_DIVIDENDS: Dividend[] = [
  { id: "d1", assetName: "Torre Catalinas Norte", amount: 38,  currency: "MKT", date: "2025-07-01", status: "pagado"     },
  { id: "d2", assetName: "Torre Catalinas Norte", amount: 42,  currency: "MKT", date: "2025-08-01", status: "programado" },
  { id: "d3", assetName: "Parque Solar Mendoza",  amount: 18,  currency: "MKT", date: "2025-08-15", status: "programado" },
];

export const MOCK_REWARDS: Reward[] = [
  { id: "r1", type: "bienvenida", description: "Bono de bienvenida al ecosistema", amount: 500, date: "2025-06-01" },
  { id: "r2", type: "staking",    description: "Reward staking mensual — junio",   amount: 50,  date: "2025-06-15" },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "dividendo", title: "Dividendo acreditado",        message: "Recibiste 38 MKT de Torre Catalinas Norte.",         date: "2025-07-01", read: false },
  { id: "n2", type: "inversion", title: "Inversión confirmada",        message: "Tu inversión en Parque Solar Mendoza fue aprobada.", date: "2025-06-20", read: true  },
  { id: "n3", type: "mercado",   title: "Nuevo activo disponible",     message: "Bodega Valle de Uco ya está en el marketplace.",     date: "2025-07-15", read: false },
  { id: "n4", type: "sistema",   title: "Próximo dividendo",           message: "El 01/08 recibís 42 MKT de Torre Catalinas Norte.",  date: "2025-07-25", read: true  },
];

export const MOCK_FAVORITES: FavoriteAsset[] = [
  { id: "f1", name: "Bodega Valle de Uco",       type: "Agroindustria",       icon: "🍇", tokenPrice: 5,  expectedReturn: "12% anual", fundedPercent: 34 },
  { id: "f2", name: "Puerto Madero Residencial", type: "Inmueble residencial", icon: "🏙️", tokenPrice: 20, expectedReturn: "9% anual",  fundedPercent: 61 },
];
