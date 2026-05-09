export type Currency = "EUR" | "USD";
export type TransactionType = "income" | "expense";
export type Section = "pretrip" | "usa_daily" | "travel_experience" | "income";
export type PaidBy = "me" | "parents" | "other" | "shared";
export type RepaymentStatus =
  | "not_applicable"
  | "advanced_to_me"
  | "pending_repayment"
  | "repaid";

export type Transaction = {
  id: string;
  type: TransactionType;
  section: Section;
  title: string;
  amount: number;
  currency: Currency;
  date: string;
  category: string;
  paymentMethod?: string;
  paidBy?: PaidBy;
  repaymentStatus?: RepaymentStatus;
  source?: string;
  destination?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  deadline?: string;
  priority: "high" | "medium" | "low";
  category: "travel" | "return_savings" | "personal_purchase" | "emergency" | "other";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TripPlan = {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  actualSpent: number;
  currency: Currency;
  status: "planned" | "in_progress" | "completed";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Budget = {
  id: string;
  category: string;
  amount: number;
  currency: Currency;
  period: "total" | "monthly" | "weekly";
};

export type Settings = {
  baseCurrency: Currency;
  exchangeRate: number;
  tripStartDate: string;
  tripEndDate: string;
  darkMode: boolean;
};

export type AppData = {
  transactions: Transaction[];
  goals: SavingsGoal[];
  tripPlans: TripPlan[];
  budgets: Budget[];
  settings: Settings;
  hasSeedData: boolean;
};

export type Filters = {
  query: string;
  category: string;
  section: "all" | Section;
  from: string;
  to: string;
};

export type AppView =
  | "dashboard"
  | "pretrip"
  | "income"
  | "daily"
  | "travel"
  | "goals"
  | "budgets"
  | "settings";
