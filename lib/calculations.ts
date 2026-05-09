import type { AppData, Budget, Currency, SavingsGoal, Settings, Transaction } from "./types";

const dayMs = 24 * 60 * 60 * 1000;

export function toBase(amount: number, currency: Currency, settings: Settings) {
  if (currency === settings.baseCurrency) return amount;
  if (currency === "EUR" && settings.baseCurrency === "USD") return amount * settings.exchangeRate;
  if (currency === "USD" && settings.baseCurrency === "EUR") return amount / settings.exchangeRate;
  return amount;
}

export function fromBase(amount: number, target: Currency, settings: Settings) {
  if (target === settings.baseCurrency) return amount;
  if (target === "EUR" && settings.baseCurrency === "USD") return amount / settings.exchangeRate;
  if (target === "USD" && settings.baseCurrency === "EUR") return amount * settings.exchangeRate;
  return amount;
}

export function formatMoney(amount: number, currency: Currency = "USD") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function daysBetweenInclusive(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / dayMs) + 1);
}

export function remainingDays(settings: Settings, now = new Date()) {
  const today = new Date(now.toDateString());
  const start = new Date(`${settings.tripStartDate}T00:00:00`);
  const end = new Date(`${settings.tripEndDate}T00:00:00`);

  if (today < start) return daysBetweenInclusive(settings.tripStartDate, settings.tripEndDate);
  if (today > end) return 0;
  return Math.max(0, Math.floor((end.getTime() - today.getTime()) / dayMs) + 1);
}

export function elapsedTripDays(settings: Settings, now = new Date()) {
  const today = new Date(now.toDateString());
  const start = new Date(`${settings.tripStartDate}T00:00:00`);
  const end = new Date(`${settings.tripEndDate}T00:00:00`);
  if (today < start) return 0;
  const capped = today > end ? end : today;
  return Math.max(1, Math.floor((capped.getTime() - start.getTime()) / dayMs) + 1);
}

function cashImpactExpense(transaction: Transaction, settings: Settings) {
  if (transaction.type !== "expense") return 0;
  const amount = toBase(transaction.amount, transaction.currency, settings);
  const paidByMe = !transaction.paidBy || transaction.paidBy === "me" || transaction.paidBy === "shared";
  const pending = transaction.repaymentStatus === "advanced_to_me" || transaction.repaymentStatus === "pending_repayment";
  return paidByMe || pending ? amount : 0;
}

export function isBudgetCategoryMatch(budgetCategory: string, transactionCategory: string) {
  const normalized = transactionCategory.toLowerCase();
  const budget = budgetCategory.toLowerCase();

  if (budget === "comida") return ["comida", "supermercado", "restaurantes"].some((item) => normalized.includes(item));
  if (budget === "transporte") return ["transporte", "bus", "tren", "taxi", "lyft", "uber", "vuelos"].some((item) => normalized.includes(item));
  if (budget === "viajes") return ["viajes", "hoteles", "excursiones", "entradas", "turismo", "souvenirs", "vuelos internos"].some((item) => normalized.includes(item));
  return normalized === budget;
}

function isInsideBudgetPeriod(date: string, period: Budget["period"], now = new Date()) {
  if (period === "total") return true;

  const itemDate = new Date(`${date}T00:00:00`);
  if (period === "monthly") {
    return itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth();
  }

  const current = new Date(now.toDateString());
  const day = current.getDay() || 7;
  const monday = new Date(current);
  monday.setDate(current.getDate() - day + 1);
  return itemDate >= monday && itemDate <= current;
}

export function goalProgress(goal: SavingsGoal, settings: Settings) {
  const target = toBase(goal.targetAmount, goal.currency, settings);
  const current = toBase(goal.currentAmount, goal.currency, settings);
  return target > 0 ? Math.min(100, (current / target) * 100) : 100;
}

export function weeklySavingNeeded(goal: SavingsGoal, settings: Settings, now = new Date()) {
  const target = toBase(goal.targetAmount, goal.currency, settings);
  const current = toBase(goal.currentAmount, goal.currency, settings);
  const missing = Math.max(0, target - current);
  const deadline = new Date(`${goal.deadline || settings.tripEndDate}T00:00:00`);
  const weeks = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (7 * dayMs)));
  return missing / weeks;
}

export function calculateApp(data: AppData, now = new Date()) {
  const { settings, transactions, goals, budgets } = data;
  const expenses = transactions.filter((item) => item.type === "expense");
  const incomes = transactions.filter((item) => item.type === "income");
  const sum = (items: Transaction[]) => items.reduce((total, item) => total + toBase(item.amount, item.currency, settings), 0);

  const totalIncome = sum(incomes);
  const totalExpenses = sum(expenses);
  const cashExpenses = expenses.reduce((total, item) => total + cashImpactExpense(item, settings), 0);
  const pendingRepaymentAmount = expenses
    .filter((item) => item.repaymentStatus === "advanced_to_me" || item.repaymentStatus === "pending_repayment")
    .reduce((total, item) => total + toBase(item.amount, item.currency, settings), 0);
  const paidByOthersAmount = expenses
    .filter((item) => item.paidBy === "parents" || item.paidBy === "other")
    .reduce((total, item) => total + toBase(item.amount, item.currency, settings), 0);

  const reservedForGoals = goals.reduce((total, goal) => total + toBase(goal.currentAmount, goal.currency, settings), 0);
  const amountNeededForGoals = goals.reduce((total, goal) => {
    const target = toBase(goal.targetAmount, goal.currency, settings);
    const current = toBase(goal.currentAmount, goal.currency, settings);
    return total + Math.max(0, target - current);
  }, 0);

  const currentBalance = totalIncome - cashExpenses;
  const freeToSpend = Math.max(0, currentBalance - reservedForGoals);
  const moneyAvailableAfterGoals = currentBalance - reservedForGoals - amountNeededForGoals;

  const preTripExpenses = sum(expenses.filter((item) => item.section === "pretrip"));
  const usaDailyExpenses = sum(expenses.filter((item) => item.section === "usa_daily"));
  const travelExperienceExpenses = sum(expenses.filter((item) => item.section === "travel_experience"));
  const tripExpenses = usaDailyExpenses + travelExperienceExpenses;
  const averageDailySpend = elapsedTripDays(settings, now) > 0 ? tripExpenses / elapsedTripDays(settings, now) : 0;
  const daysLeft = remainingDays(settings, now);
  const recommendedDailyBudget = daysLeft > 0 ? freeToSpend / daysLeft : freeToSpend;
  const projectedFinalSavings = currentBalance - averageDailySpend * daysLeft;

  const spendingByCategory = expenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + toBase(item.amount, item.currency, settings);
    return acc;
  }, {});

  const budgetUsage = budgets.map((budget) => {
    const assigned = toBase(budget.amount, budget.currency, settings);
    const spent = expenses
      .filter((item) => isBudgetCategoryMatch(budget.category, item.category))
      .filter((item) => isInsideBudgetPeriod(item.date, budget.period, now))
      .reduce((total, item) => total + toBase(item.amount, item.currency, settings), 0);
    return {
      budget,
      assigned,
      spent,
      percentage: assigned > 0 ? (spent / assigned) * 100 : 0
    };
  });

  const goalStats = goals.map((goal) => {
    const target = toBase(goal.targetAmount, goal.currency, settings);
    const current = toBase(goal.currentAmount, goal.currency, settings);
    return {
      goal,
      target,
      current,
      missing: Math.max(0, target - current),
      percentage: goalProgress(goal, settings),
      weeklyNeeded: weeklySavingNeeded(goal, settings, now)
    };
  });

  const warnings = buildInsights({
    totalIncome,
    totalExpenses,
    currentBalance,
    freeToSpend,
    reservedForGoals,
    averageDailySpend,
    recommendedDailyBudget,
    projectedFinalSavings,
    budgetUsage,
    goalStats,
    spendingByCategory,
    settings
  });

  const health: "good" | "tight" | "bad" =
    freeToSpend < 50 || averageDailySpend > recommendedDailyBudget * 1.2
      ? "bad"
      : averageDailySpend > recommendedDailyBudget * 0.9 || moneyAvailableAfterGoals < 0
        ? "tight"
        : "good";

  return {
    totalIncome,
    totalExpenses,
    currentBalance,
    freeToSpend,
    reservedForGoals,
    preTripExpenses,
    usaDailyExpenses,
    travelExperienceExpenses,
    pendingRepaymentAmount,
    paidByOthersAmount,
    averageDailySpend,
    remainingDays: daysLeft,
    recommendedDailyBudget,
    spendingByCategory,
    budgetUsage,
    goalStats,
    amountNeededForGoals,
    projectedFinalSavings,
    moneyAvailableAfterGoals,
    warnings,
    health
  };
}

type InsightInput = {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  freeToSpend: number;
  reservedForGoals: number;
  averageDailySpend: number;
  recommendedDailyBudget: number;
  projectedFinalSavings: number;
  budgetUsage: Array<{ budget: Budget; assigned: number; spent: number; percentage: number }>;
  goalStats: Array<{ goal: SavingsGoal; target: number; current: number; missing: number; percentage: number; weeklyNeeded: number }>;
  spendingByCategory: Record<string, number>;
  settings: Settings;
};

function buildInsights(input: InsightInput) {
  const alerts: Array<{ tone: "good" | "warn" | "danger" | "info"; title: string; body: string }> = [];
  const base = input.settings.baseCurrency;

  if (input.recommendedDailyBudget > 0 && input.averageDailySpend <= input.recommendedDailyBudget) {
    alerts.push({
      tone: "good",
      title: "Vas bien de ritmo.",
      body: `Puedes gastar aproximadamente ${formatMoney(input.recommendedDailyBudget, base)} al día respetando tus objetivos.`
    });
  }

  if (input.averageDailySpend > input.recommendedDailyBudget * 1.15 && input.averageDailySpend > 0) {
    alerts.push({
      tone: "warn",
      title: "Cuidado con el ritmo.",
      body: `Estás gastando más de lo recomendado: media de ${formatMoney(input.averageDailySpend, base)} al día.`
    });
  }

  if (input.projectedFinalSavings > 0) {
    alerts.push({
      tone: "info",
      title: "Proyección de vuelta",
      body: `Si mantienes este ritmo, podrías volver con ${formatMoney(input.projectedFinalSavings, base)}.`
    });
  }

  if (input.freeToSpend < 100) {
    alerts.push({
      tone: "danger",
      title: "Poco dinero libre.",
      body: "Un gasto grande ahora afectaría a tus objetivos de viajes, iPhone o vuelta a España."
    });
  }

  input.goalStats
    .filter((goal) => goal.goal.priority === "high" && goal.percentage < 35)
    .slice(0, 2)
    .forEach((goal) => {
      alerts.push({
        tone: "warn",
        title: `${goal.goal.name} va justo.`,
        body: `Faltan ${formatMoney(goal.missing, base)}. Intenta reservar ${formatMoney(goal.weeklyNeeded, base)} por semana.`
      });
    });

  input.budgetUsage
    .filter((item) => item.percentage >= 100)
    .slice(0, 2)
    .forEach((item) => {
      alerts.push({
        tone: "danger",
        title: `Presupuesto superado: ${item.budget.category}`,
        body: `Llevas ${formatMoney(item.spent, base)} de ${formatMoney(item.assigned, base)}.`
      });
    });

  ["Ocio", "Ropa", "Comida", "Supermercado", "Restaurantes"].forEach((category) => {
    const value = input.spendingByCategory[category] || 0;
    if (input.totalExpenses > 0 && value / input.totalExpenses > 0.28) {
      alerts.push({
        tone: "warn",
        title: `Mucho peso en ${category.toLowerCase()}.`,
        body: `${category} concentra ${Math.round((value / input.totalExpenses) * 100)}% de tus gastos registrados.`
      });
    }
  });

  return alerts.slice(0, 6);
}
