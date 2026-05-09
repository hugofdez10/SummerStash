import type { AppData, Budget, SavingsGoal, Settings, Transaction, TripPlan } from "./types";

const now = "2026-05-09T10:00:00.000Z";

const makeTransaction = (transaction: Omit<Transaction, "createdAt" | "updatedAt">): Transaction => ({
  ...transaction,
  createdAt: now,
  updatedAt: now
});

const makeGoal = (goal: Omit<SavingsGoal, "createdAt" | "updatedAt">): SavingsGoal => ({
  ...goal,
  createdAt: now,
  updatedAt: now
});

const makeTripPlan = (trip: Omit<TripPlan, "createdAt" | "updatedAt">): TripPlan => ({
  ...trip,
  createdAt: now,
  updatedAt: now
});

export const defaultSettings: Settings = {
  baseCurrency: "USD",
  exchangeRate: 1.08,
  tripStartDate: "2026-06-13",
  tripEndDate: "2026-09-12",
  darkMode: false
};

export const sampleTransactions: Transaction[] = [
  makeTransaction({
    id: "seed-agency",
    type: "expense",
    section: "pretrip",
    title: "Pago agencia Work & Travel",
    amount: 850,
    currency: "EUR",
    date: "2026-03-15",
    category: "Agencia",
    paymentMethod: "Transferencia",
    paidBy: "me",
    repaymentStatus: "not_applicable",
    notes: "Programa y gestión inicial"
  }),
  makeTransaction({
    id: "seed-flight",
    type: "expense",
    section: "pretrip",
    title: "Vuelo Madrid - Nueva York",
    amount: 620,
    currency: "EUR",
    date: "2026-04-28",
    category: "Vuelos",
    paymentMethod: "Tarjeta",
    paidBy: "parents",
    repaymentStatus: "pending_repayment",
    notes: "Pendiente devolver parte a mis padres"
  }),
  makeTransaction({
    id: "seed-jfk-albany",
    type: "expense",
    section: "pretrip",
    title: "Transporte JFK a Albany",
    amount: 78,
    currency: "USD",
    date: "2026-06-13",
    category: "Bus",
    paymentMethod: "Tarjeta",
    paidBy: "me",
    repaymentStatus: "not_applicable"
  }),
  makeTransaction({
    id: "seed-lyft",
    type: "expense",
    section: "pretrip",
    title: "Lyft hasta alojamiento",
    amount: 32,
    currency: "USD",
    date: "2026-06-13",
    category: "Lyft/Uber",
    paymentMethod: "Apple Pay",
    paidBy: "shared",
    repaymentStatus: "not_applicable"
  }),
  makeTransaction({
    id: "seed-esim",
    type: "expense",
    section: "pretrip",
    title: "eSIM inicial",
    amount: 28,
    currency: "USD",
    date: "2026-06-12",
    category: "eSIM inicial",
    paymentMethod: "Revolut",
    paidBy: "me",
    repaymentStatus: "not_applicable"
  }),
  makeTransaction({
    id: "seed-paycheck",
    type: "income",
    section: "income",
    title: "Primer ingreso de trabajo",
    amount: 740,
    currency: "USD",
    date: "2026-06-28",
    category: "Trabajo",
    source: "Trabajo",
    notes: "Ingreso neto recibido"
  }),
  makeTransaction({
    id: "seed-groceries",
    type: "expense",
    section: "usa_daily",
    title: "Compra supermercado",
    amount: 46.35,
    currency: "USD",
    date: "2026-06-29",
    category: "Supermercado",
    paymentMethod: "Tarjeta"
  }),
  makeTransaction({
    id: "seed-laundry",
    type: "expense",
    section: "usa_daily",
    title: "Lavandería",
    amount: 7.5,
    currency: "USD",
    date: "2026-06-30",
    category: "Lavandería",
    paymentMethod: "Efectivo"
  }),
  makeTransaction({
    id: "seed-clothes",
    type: "expense",
    section: "usa_daily",
    title: "Camiseta y pantalón",
    amount: 58,
    currency: "USD",
    date: "2026-07-02",
    category: "Ropa",
    paymentMethod: "Tarjeta"
  }),
  makeTransaction({
    id: "seed-fun",
    type: "expense",
    section: "usa_daily",
    title: "Noche con amigos",
    amount: 34,
    currency: "USD",
    date: "2026-07-05",
    category: "Ocio",
    paymentMethod: "Apple Pay"
  })
];

export const sampleGoals: SavingsGoal[] = [
  makeGoal({
    id: "seed-goal-return",
    name: "Volver con 1.000 $",
    targetAmount: 1000,
    currentAmount: 280,
    currency: "USD",
    deadline: "2026-09-12",
    priority: "high",
    category: "return_savings",
    notes: "Colchón para volver a España tranquilo"
  }),
  makeGoal({
    id: "seed-goal-iphone",
    name: "iPhone nuevo",
    targetAmount: 950,
    currentAmount: 180,
    currency: "USD",
    deadline: "2026-11-01",
    priority: "medium",
    category: "personal_purchase",
    notes: "No tocar salvo que el verano vaya muy bien"
  }),
  makeGoal({
    id: "seed-goal-travel",
    name: "Viajar por USA",
    targetAmount: 800,
    currentAmount: 220,
    currency: "USD",
    deadline: "2026-08-20",
    priority: "high",
    category: "travel"
  }),
  makeGoal({
    id: "seed-goal-emergency",
    name: "Fondo de emergencia",
    targetAmount: 300,
    currentAmount: 150,
    currency: "USD",
    deadline: "2026-06-13",
    priority: "high",
    category: "emergency"
  })
];

export const sampleTripPlans: TripPlan[] = [
  makeTripPlan({
    id: "seed-trip-nyc",
    name: "Fin de semana en Nueva York",
    destination: "Nueva York",
    startDate: "2026-07-19",
    endDate: "2026-07-21",
    estimatedBudget: 420,
    actualSpent: 0,
    currency: "USD",
    status: "planned",
    notes: "Bus + hostel + comida + alguna entrada"
  })
];

export const sampleBudgets: Budget[] = [
  { id: "seed-budget-food", category: "Comida", amount: 650, currency: "USD", period: "total" },
  { id: "seed-budget-clothes", category: "Ropa", amount: 250, currency: "USD", period: "total" },
  { id: "seed-budget-fun", category: "Ocio", amount: 350, currency: "USD", period: "total" },
  { id: "seed-budget-transport", category: "Transporte", amount: 300, currency: "USD", period: "total" },
  { id: "seed-budget-travel", category: "Viajes", amount: 900, currency: "USD", period: "total" },
  { id: "seed-budget-emergency", category: "Emergencias", amount: 200, currency: "USD", period: "total" }
];

export const initialData: AppData = {
  transactions: sampleTransactions,
  goals: sampleGoals,
  tripPlans: sampleTripPlans,
  budgets: sampleBudgets,
  settings: defaultSettings,
  hasSeedData: true
};

export const emptyData: AppData = {
  transactions: [],
  goals: [],
  tripPlans: [],
  budgets: [],
  settings: defaultSettings,
  hasSeedData: false
};
