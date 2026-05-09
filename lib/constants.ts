import type { AppView, Currency, PaidBy, RepaymentStatus, Section } from "./types";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Flag,
  Goal,
  Home,
  Plane,
  Settings,
  ShoppingBasket,
  WalletCards
} from "lucide-react";

export const STORAGE_KEY = "work-travel-money-v1";

export const currencySymbols: Record<Currency, string> = {
  EUR: "€",
  USD: "$"
};

export const preTripCategories = [
  "Agencia",
  "Vuelos",
  "Visado",
  "SEVIS",
  "Seguro",
  "Maletas",
  "Ropa previa",
  "Transporte de llegada",
  "Transporte de salida",
  "Bus",
  "Tren",
  "Taxi",
  "Lyft/Uber",
  "Hotel inicial o final",
  "eSIM inicial",
  "Otros"
];

export const dailyCategories = [
  "Comida",
  "Supermercado",
  "Restaurantes",
  "Ropa",
  "Lavandería",
  "Ocio",
  "Transporte local",
  "Teléfono",
  "Compras",
  "Emergencias",
  "Otros"
];

export const travelCategories = [
  "Viajes",
  "Hoteles",
  "Transporte entre ciudades",
  "Vuelos internos",
  "Trenes",
  "Buses",
  "Excursiones",
  "Entradas",
  "Turismo",
  "Comida durante viajes",
  "Souvenirs",
  "Otros"
];

export const budgetCategories = [
  "Comida",
  "Ropa",
  "Ocio",
  "Transporte",
  "Lavandería",
  "Teléfono",
  "Viajes",
  "Emergencias",
  "Otros"
];

export const incomeSources = ["Trabajo", "Transferencia familiar", "Devolución", "Otro"];
export const paymentMethods = ["Tarjeta", "Efectivo", "Transferencia", "Apple Pay", "Revolut", "Otro"];

export const paidByLabels: Record<PaidBy, string> = {
  me: "Yo",
  parents: "Mis padres",
  other: "Otra persona",
  shared: "Compartido"
};

export const repaymentLabels: Record<RepaymentStatus, string> = {
  not_applicable: "Pagado por mí",
  advanced_to_me: "Me lo adelantaron",
  pending_repayment: "Pendiente de devolver",
  repaid: "Ya devuelto"
};

export const sectionLabels: Record<Section, string> = {
  pretrip: "Pre-viaje",
  usa_daily: "Vida diaria",
  travel_experience: "Viajes",
  income: "Ingresos"
};

export const navItems: Array<{ id: AppView; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "pretrip", label: "Pre-viaje", icon: Plane },
  { id: "income", label: "Ingresos", icon: BriefcaseBusiness },
  { id: "daily", label: "Vida", icon: ShoppingBasket },
  { id: "travel", label: "Viajes", icon: Flag },
  { id: "goals", label: "Objetivos", icon: Goal },
  { id: "budgets", label: "Presupuestos", icon: BarChart3 },
  { id: "settings", label: "Ajustes", icon: Settings }
];

export const quickNavItems = navItems.filter((item) =>
  ["dashboard", "pretrip", "daily", "travel", "goals"].includes(item.id)
);

export const pocketLabels: Record<string, string> = {
  travel: "Reservado para viajes",
  return_savings: "Reservado para volver",
  personal_purchase: "Reservado para iPhone",
  emergency: "Fondo de emergencia",
  other: "Otros objetivos"
};
