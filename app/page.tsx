"use client";

import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  Edit3,
  FileJson,
  Filter,
  Goal,
  LogIn,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Trash2,
  Upload,
  UserPlus,
  X
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  budgetCategories,
  currencySymbols,
  dailyCategories,
  incomeSources,
  navItems,
  paidByLabels,
  paymentMethods,
  pocketLabels,
  preTripCategories,
  quickNavItems,
  repaymentLabels,
  sectionLabels,
  travelCategories
} from "@/lib/constants";
import {
  calculateApp,
  formatMoney,
  fromBase,
  goalProgress,
  isBudgetCategoryMatch,
  toBase,
  weeklySavingNeeded
} from "@/lib/calculations";
import { clearData, createId, loadData, saveData } from "@/lib/storage";
import { defaultSettings, emptyData, initialData } from "@/lib/seed";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  AppData,
  AppView,
  Budget,
  Currency,
  Filters,
  SavingsGoal,
  Section,
  Transaction,
  TripPlan
} from "@/lib/types";

const emptyFilters: Filters = {
  query: "",
  category: "",
  section: "all",
  from: "",
  to: ""
};

const sectionToView: Record<Section, AppView> = {
  pretrip: "pretrip",
  income: "income",
  usa_daily: "daily",
  travel_experience: "travel"
};

const viewTitles: Record<AppView, { title: string; eyebrow: string }> = {
  dashboard: { title: "Tu verano en números", eyebrow: "Work & Travel USA" },
  pretrip: { title: "Gastos pre-viaje", eyebrow: "Antes de despegar" },
  income: { title: "Ingresos USA", eyebrow: "Dinero real que entra" },
  daily: { title: "Vida diaria", eyebrow: "Día a día en USA" },
  travel: { title: "Viajes y experiencias", eyebrow: "La parte bonita del plan" },
  goals: { title: "Objetivos de ahorro", eyebrow: "Bolsillos mentales" },
  budgets: { title: "Presupuestos", eyebrow: "Límites por categoría" },
  settings: { title: "Ajustes", eyebrow: "Moneda, fechas y datos" }
};

type TransactionDraft = {
  title: string;
  amount: string;
  currency: Currency;
  date: string;
  category: string;
  paymentMethod: string;
  paidBy: "me" | "parents" | "other" | "shared";
  repaymentStatus: "not_applicable" | "advanced_to_me" | "pending_repayment" | "repaid";
  source: string;
  destination: string;
  notes: string;
};

type GoalDraft = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  currency: Currency;
  deadline: string;
  priority: SavingsGoal["priority"];
  category: SavingsGoal["category"];
  notes: string;
};

type TripDraft = {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  estimatedBudget: string;
  actualSpent: string;
  currency: Currency;
  status: TripPlan["status"];
  notes: string;
};

type BudgetDraft = {
  category: string;
  amount: string;
  currency: Currency;
  period: Budget["period"];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function transactionDraft(section: Section, transaction?: Transaction): TransactionDraft {
  const category =
    section === "pretrip"
      ? preTripCategories[0]
      : section === "usa_daily"
        ? dailyCategories[0]
        : section === "travel_experience"
          ? travelCategories[0]
          : incomeSources[0];

  return {
    title: transaction?.title || "",
    amount: transaction ? String(transaction.amount) : "",
    currency: transaction?.currency || "USD",
    date: transaction?.date || today(),
    category: transaction?.category || category,
    paymentMethod: transaction?.paymentMethod || paymentMethods[0],
    paidBy: transaction?.paidBy || "me",
    repaymentStatus: transaction?.repaymentStatus || "not_applicable",
    source: transaction?.source || incomeSources[0],
    destination: transaction?.destination || "",
    notes: transaction?.notes || ""
  };
}

function goalDraft(goal?: SavingsGoal): GoalDraft {
  return {
    name: goal?.name || "",
    targetAmount: goal ? String(goal.targetAmount) : "",
    currentAmount: goal ? String(goal.currentAmount) : "0",
    currency: goal?.currency || "USD",
    deadline: goal?.deadline || "",
    priority: goal?.priority || "medium",
    category: goal?.category || "return_savings",
    notes: goal?.notes || ""
  };
}

function tripDraft(trip?: TripPlan): TripDraft {
  return {
    name: trip?.name || "",
    destination: trip?.destination || "",
    startDate: trip?.startDate || today(),
    endDate: trip?.endDate || today(),
    estimatedBudget: trip ? String(trip.estimatedBudget) : "",
    actualSpent: trip ? String(trip.actualSpent) : "0",
    currency: trip?.currency || "USD",
    status: trip?.status || "planned",
    notes: trip?.notes || ""
  };
}

function budgetDraft(budget?: Budget): BudgetDraft {
  return {
    category: budget?.category || budgetCategories[0],
    amount: budget ? String(budget.amount) : "",
    currency: budget?.currency || "USD",
    period: budget?.period || "total"
  };
}

export default function Page() {
  const [data, setData] = useState<AppData>(initialData);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<AppView>("dashboard");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadData();
    setData(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveData(data);
    document.documentElement.classList.toggle("dark", data.settings.darkMode);
  }, [data, ready]);

  const calc = useMemo(() => calculateApp(data), [data]);

  const filteredTransactions = useMemo(() => {
    return data.transactions
      .filter((item) => (filters.section === "all" ? true : item.section === filters.section))
      .filter((item) => (filters.category ? item.category === filters.category : true))
      .filter((item) => (filters.from ? item.date >= filters.from : true))
      .filter((item) => (filters.to ? item.date <= filters.to : true))
      .filter((item) => {
        const q = filters.query.trim().toLowerCase();
        if (!q) return true;
        return [item.title, item.category, item.notes, item.destination, item.source]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.transactions, filters]);

  const setAndPersist = (next: AppData | ((current: AppData) => AppData)) => {
    setData((current) => (typeof next === "function" ? next(current) : next));
  };

  function upsertTransaction(section: Section, draft: TransactionDraft, editing?: Transaction | null) {
    const isIncome = section === "income";
    const now = new Date().toISOString();
    const transaction: Transaction = {
      id: editing?.id || createId(isIncome ? "income" : "expense"),
      type: isIncome ? "income" : "expense",
      section,
      title: draft.title.trim() || (isIncome ? "Ingreso" : "Gasto"),
      amount: Number(draft.amount) || 0,
      currency: draft.currency,
      date: draft.date,
      category: isIncome ? draft.source : draft.category,
      paymentMethod: isIncome ? undefined : draft.paymentMethod,
      paidBy: isIncome ? undefined : draft.paidBy,
      repaymentStatus: isIncome ? "not_applicable" : draft.repaymentStatus,
      source: isIncome ? draft.source : undefined,
      destination: section === "travel_experience" ? draft.destination : undefined,
      notes: draft.notes.trim(),
      createdAt: editing?.createdAt || now,
      updatedAt: now
    };

    setAndPersist((current) => ({
      ...current,
      transactions: editing
        ? current.transactions.map((item) => (item.id === editing.id ? transaction : item))
        : [transaction, ...current.transactions],
      hasSeedData: current.hasSeedData && !editing
    }));
    setEditingTransaction(null);
  }

  function deleteTransaction(id: string) {
    setAndPersist((current) => ({
      ...current,
      transactions: current.transactions.filter((item) => item.id !== id)
    }));
  }

  function upsertGoal(draft: GoalDraft, editing?: SavingsGoal | null) {
    const now = new Date().toISOString();
    const goal: SavingsGoal = {
      id: editing?.id || createId("goal"),
      name: draft.name.trim() || "Objetivo",
      targetAmount: Number(draft.targetAmount) || 0,
      currentAmount: Number(draft.currentAmount) || 0,
      currency: draft.currency,
      deadline: draft.deadline || undefined,
      priority: draft.priority,
      category: draft.category,
      notes: draft.notes.trim(),
      createdAt: editing?.createdAt || now,
      updatedAt: now
    };

    setAndPersist((current) => ({
      ...current,
      goals: editing ? current.goals.map((item) => (item.id === editing.id ? goal : item)) : [goal, ...current.goals]
    }));
  }

  function upsertTrip(draft: TripDraft, editing?: TripPlan | null) {
    const now = new Date().toISOString();
    const trip: TripPlan = {
      id: editing?.id || createId("trip"),
      name: draft.name.trim() || "Viaje",
      destination: draft.destination.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      estimatedBudget: Number(draft.estimatedBudget) || 0,
      actualSpent: Number(draft.actualSpent) || 0,
      currency: draft.currency,
      status: draft.status,
      notes: draft.notes.trim(),
      createdAt: editing?.createdAt || now,
      updatedAt: now
    };

    setAndPersist((current) => ({
      ...current,
      tripPlans: editing
        ? current.tripPlans.map((item) => (item.id === editing.id ? trip : item))
        : [trip, ...current.tripPlans]
    }));
  }

  function upsertBudget(draft: BudgetDraft, editing?: Budget | null) {
    const budget: Budget = {
      id: editing?.id || createId("budget"),
      category: draft.category,
      amount: Number(draft.amount) || 0,
      currency: draft.currency,
      period: draft.period
    };

    setAndPersist((current) => ({
      ...current,
      budgets: editing
        ? current.budgets.map((item) => (item.id === editing.id ? budget : item))
        : [budget, ...current.budgets]
    }));
  }

  function removeSeedData() {
    setAndPersist((current) => ({
      ...current,
      transactions: current.transactions.filter((item) => !item.id.startsWith("seed-")),
      goals: current.goals.filter((item) => !item.id.startsWith("seed-")),
      tripPlans: current.tripPlans.filter((item) => !item.id.startsWith("seed-")),
      budgets: current.budgets.filter((item) => !item.id.startsWith("seed-")),
      hasSeedData: false
    }));
  }

  function resetEverything() {
    clearData();
    setData({ ...initialData, settings: { ...defaultSettings } });
    setFilters(emptyFilters);
    setView("dashboard");
  }

  function resetToEmptyData() {
    clearData();
    setData({ ...emptyData, settings: { ...defaultSettings, darkMode: data.settings.darkMode } });
    setFilters(emptyFilters);
    setView("dashboard");
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "work-travel-money.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData;
        setData({
          transactions: parsed.transactions || [],
          goals: parsed.goals || [],
          tripPlans: parsed.tripPlans || [],
          budgets: parsed.budgets || [],
          settings: { ...defaultSettings, ...parsed.settings },
          hasSeedData: Boolean(parsed.hasSeedData)
        });
      } catch {
        alert("No he podido importar ese JSON. Revisa que sea un export de esta app.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  const activeTitle = viewTitles[view];

  return (
    <main className="min-h-screen bg-soft pb-24 text-ink dark:bg-slate-950 dark:text-slate-100 lg:h-screen lg:overflow-hidden lg:pb-0">
      <div className="flex min-h-screen w-full gap-0 lg:h-screen">
        <aside className="hidden h-screen w-72 shrink-0 border-r border-line bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:shadow-none lg:block">
          <div className="px-3 py-4">
            <BrandLogo />
            <p className="mt-1 text-sm text-muted dark:text-slate-400">Control claro del verano en USA.</p>
          </div>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:h-screen lg:overflow-y-auto lg:px-7">
          <header className="mb-5 flex flex-col gap-4 rounded-3xl border border-line bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="label">{activeTitle.eyebrow}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{activeTitle.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="icon-button"
                title={data.settings.darkMode ? "Modo claro" : "Modo oscuro"}
                onClick={() =>
                  setAndPersist((current) => ({
                    ...current,
                    settings: { ...current.settings, darkMode: !current.settings.darkMode }
                  }))
                }
              >
                {data.settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="secondary-button" onClick={() => setView("settings")}>
                <CalendarDays size={18} />
                {data.settings.tripStartDate.slice(5).replace("-", "/")} - {data.settings.tripEndDate.slice(5).replace("-", "/")}
              </button>
            </div>
          </header>

          {view === "dashboard" && (
            <Dashboard
              data={data}
              calc={calc}
              setView={setView}
              onEditTransaction={setEditingTransaction}
              onDeleteTransaction={deleteTransaction}
            />
          )}
          {view === "pretrip" && (
            <TransactionSection
              section="pretrip"
              data={data}
              transactions={filteredTransactions.filter((item) => item.section === "pretrip")}
              filters={filters}
              setFilters={setFilters}
              onSubmit={upsertTransaction}
              onEdit={setEditingTransaction}
              onDelete={deleteTransaction}
            />
          )}
          {view === "income" && (
            <TransactionSection
              section="income"
              data={data}
              transactions={filteredTransactions.filter((item) => item.section === "income")}
              filters={filters}
              setFilters={setFilters}
              onSubmit={upsertTransaction}
              onEdit={setEditingTransaction}
              onDelete={deleteTransaction}
            />
          )}
          {view === "daily" && (
            <TransactionSection
              section="usa_daily"
              data={data}
              transactions={filteredTransactions.filter((item) => item.section === "usa_daily")}
              filters={filters}
              setFilters={setFilters}
              onSubmit={upsertTransaction}
              onEdit={setEditingTransaction}
              onDelete={deleteTransaction}
            />
          )}
          {view === "travel" && (
            <TravelView
              data={data}
              transactions={filteredTransactions.filter((item) => item.section === "travel_experience")}
              filters={filters}
              setFilters={setFilters}
              onSubmitTransaction={upsertTransaction}
              onEditTransaction={setEditingTransaction}
              onDeleteTransaction={deleteTransaction}
              onSubmitTrip={upsertTrip}
              onDeleteTrip={(id) =>
                setAndPersist((current) => ({
                  ...current,
                  tripPlans: current.tripPlans.filter((item) => item.id !== id)
                }))
              }
            />
          )}
          {view === "goals" && (
            <GoalsView
              data={data}
              calc={calc}
              onSubmit={upsertGoal}
              onDelete={(id) =>
                setAndPersist((current) => ({
                  ...current,
                  goals: current.goals.filter((item) => item.id !== id)
                }))
              }
            />
          )}
          {view === "budgets" && (
            <BudgetsView
              data={data}
              calc={calc}
              onSubmit={upsertBudget}
              onDelete={(id) =>
                setAndPersist((current) => ({
                  ...current,
                  budgets: current.budgets.filter((item) => item.id !== id)
                }))
              }
            />
          )}
          {view === "settings" && (
            <SettingsView
              data={data}
              setData={setAndPersist}
              onExport={exportJson}
              onImport={() => fileInputRef.current?.click()}
              onReset={resetEverything}
              onRemoveSeed={removeSeedData}
              onFreshAccount={resetToEmptyData}
            />
          )}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {quickNavItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold ${
                  active ? "bg-blue-600 text-white" : "text-slate-500 dark:text-slate-300"
                }`}
              >
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <input ref={fileInputRef} className="hidden" type="file" accept="application/json" onChange={importJson} />

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={upsertTransaction}
        />
      )}
    </main>
  );
}

function Dashboard({
  data,
  calc,
  setView,
  onEditTransaction,
  onDeleteTransaction
}: {
  data: AppData;
  calc: ReturnType<typeof calculateApp>;
  setView: (view: AppView) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}) {
  const base = data.settings.baseCurrency;
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const weeklySpend = periodSpend(data.transactions, data.settings, "weekly");
  const monthlySpend = periodSpend(data.transactions, data.settings, "monthly");

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroMoneyCard
          title="Balance actual"
          value={formatMoney(calc.currentBalance, base)}
          detail={`Libre: ${formatMoney(calc.freeToSpend, base)}`}
          tone={calc.health}
        />
        <MetricCard label="Ingresado" value={formatMoney(calc.totalIncome, base)} icon={<ArrowDownCircle size={19} />} tone="good" />
        <MetricCard label="Gastado" value={formatMoney(calc.totalExpenses, base)} icon={<ArrowUpCircle size={19} />} tone="danger" />
        <MetricCard label="Día recomendado" value={formatMoney(calc.recommendedDailyBudget, base)} icon={<CircleDollarSign size={19} />} tone="info" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label">Estado general</p>
              <h3 className="mt-1 text-xl font-bold">
                {calc.health === "good" ? "Vas bien." : calc.health === "tight" ? "Vas justo." : "Toca frenar."}
              </h3>
            </div>
            <StatusPill status={calc.health} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {calc.warnings.map((warning) => (
              <Insight key={`${warning.title}-${warning.body}`} {...warning} />
            ))}
          </div>
        </div>
        <div className="card">
          <p className="label">Ritmo del viaje</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Días restantes" value={String(calc.remainingDays)} />
            <MiniStat label="Media diaria" value={formatMoney(calc.averageDailySpend, base)} />
            <MiniStat label="Pre-viaje" value={formatMoney(calc.preTripExpenses, base)} />
            <MiniStat label="Viajes" value={formatMoney(calc.travelExperienceExpenses, base)} />
            <MiniStat label="Vida diaria" value={formatMoney(calc.usaDailyExpenses, base)} />
            <MiniStat label="Pagado por otros" value={formatMoney(calc.paidByOthersAmount, base)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Bolsillos</p>
              <h3 className="mt-1 text-lg font-bold">No todo está disponible</h3>
            </div>
            <button className="secondary-button" onClick={() => setView("goals")}>
              Ver
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <PocketRow label="Dinero libre para gastar" value={calc.freeToSpend} total={calc.currentBalance} currency={base} strong />
            {data.goals.map((goal) => (
              <PocketRow
                key={goal.id}
                label={pocketLabels[goal.category] || goal.name}
                value={toBase(goal.currentAmount, goal.currency, data.settings)}
                total={Math.max(calc.currentBalance, calc.reservedForGoals)}
                currency={base}
              />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Movimientos recientes</p>
              <h3 className="mt-1 text-lg font-bold">Últimos registros</h3>
            </div>
            <button className="secondary-button" onClick={() => setView("daily")}>
              Añadir
              <Plus size={16} />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {recent.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                settings={data.settings}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Reservado objetivos" value={formatMoney(calc.reservedForGoals, base)} icon={<Goal size={19} />} tone="info" />
        <MetricCard label="Deuda pendiente" value={formatMoney(calc.pendingRepaymentAmount, base)} icon={<AlertTriangle size={19} />} tone="warn" />
        <MetricCard label="Resumen semanal" value={formatMoney(weeklySpend, base)} icon={<CalendarDays size={19} />} tone="info" />
        <MetricCard label="Resumen mensual" value={formatMoney(monthlySpend, base)} icon={<CalendarDays size={19} />} tone="info" />
      </section>
    </div>
  );
}

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/summer-stash-logo.png"
        alt="Summer Stash"
        className="h-16 w-16 shrink-0 rounded-2xl object-contain"
      />
      <div className="min-w-0 leading-none">
        <p className="font-black tracking-wide text-[#24476f] dark:text-slate-100" style={{ fontSize: "clamp(1.2rem, 1.8vw, 1.55rem)" }}>
          SUMMER
        </p>
        <p className="mt-1 font-black tracking-wide text-[#ee554f]" style={{ fontSize: "clamp(1.2rem, 1.8vw, 1.55rem)" }}>
          STASH
        </p>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-slate-100 dark:bg-slate-950 dark:shadow-none dark:ring-slate-800">
      <svg viewBox="0 0 96 96" aria-label="Summer Stash" className="h-14 w-14" role="img">
        <defs>
          <clipPath id="summerStashCircle">
            <circle cx="48" cy="48" r="42" />
          </clipPath>
          <linearGradient id="summerSky" x1="52" x2="84" y1="10" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffe9b4" />
            <stop offset="1" stopColor="#f8d58e" />
          </linearGradient>
        </defs>
        <g clipPath="url(#summerStashCircle)">
          <rect width="96" height="96" fill="url(#summerSky)" />
          <path d="M0 0h47c-12 16-13 40-4 60C29 53 14 51 0 57V0Z" fill="#24476f" />
          <path d="M0 62c18-9 33-5 47 5 17 12 34 8 49-3v10c-19 12-36 14-54 2C27 66 14 65 0 74V62Z" fill="#fff" />
          <path d="M0 72c17-8 31-5 45 4 18 12 35 11 51 0v13c-21 11-40 10-57 0C25 81 13 81 0 89V72Z" fill="#ee554f" />
          <path d="M0 88c13-8 26-8 40-1 15 8 31 10 49 3-9 9-23 15-39 15C28 105 9 98 0 88Z" fill="#ee554f" />
          <path d="M22 29l3.8 8 8.8 1.1-6.4 6.1 1.6 8.7L22 48.7l-7.8 4.2 1.6-8.7-6.4-6.1 8.8-1.1L22 29Z" fill="#fff" />
          <path d="M62 42c2-9 7-15 17-17M62 42c8-4 15-3 23 2M62 42c6 3 10 9 11 19M62 42c-2 7-2 14 1 22" stroke="#24476f" strokeLinecap="round" strokeWidth="4" />
          <path d="M66 31c7-4 12-1 15 4M64 35c7-1 11 2 13 8" stroke="#24476f" strokeLinecap="round" strokeWidth="4" />
          <path d="M45 25c2.8-3 6-3 9 0M57 32c2.8-3 6-3 9 0M32 22c2.8-3 6-3 9 0" stroke="#24476f" strokeLinecap="round" strokeWidth="3" />
        </g>
        <circle cx="48" cy="48" r="42" fill="none" stroke="#fff" strokeWidth="4" />
        <circle cx="48" cy="43" r="15" fill="#f7c35f" stroke="#fff" strokeWidth="5" />
        <path d="M48 34v18M54 38c-1.3-2-3.3-3-6-3-3 0-5.3 1.4-5.3 3.7 0 5.7 11.3 2.4 11.3 8.3 0 2.5-2.5 4.2-6.2 4.2-3 0-5.5-1-7-3.1" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
        <path d="M33 43h30a11 11 0 0 1 11 11v18H30a12 12 0 0 1-12-12v-4a13 13 0 0 1 13-13Z" fill="#24476f" stroke="#fff" strokeWidth="5" />
        <path d="M32 53h28" stroke="#fff" strokeDasharray="7 6" strokeLinecap="round" strokeWidth="3" />
        <circle cx="62" cy="61" r="5" fill="none" stroke="#fff" strokeWidth="4" />
      </svg>
    </div>
  );
}

function TransactionSection({
  section,
  data,
  transactions,
  filters,
  setFilters,
  onSubmit,
  onEdit,
  onDelete
}: {
  section: Section;
  data: AppData;
  transactions: Transaction[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onSubmit: (section: Section, draft: TransactionDraft, editing?: Transaction | null) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const total = transactions.reduce((sum, item) => sum + toBase(item.amount, item.currency, data.settings), 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-5">
        <TransactionForm section={section} onSubmit={(draft) => onSubmit(section, draft)} />
        <div className="card">
          <p className="label">Total visible</p>
          <p className="mt-2 text-3xl font-bold">{formatMoney(total, data.settings.baseCurrency)}</p>
          <p className="mt-1 text-sm text-muted dark:text-slate-400">
            {transactions.length} movimiento{transactions.length === 1 ? "" : "s"} con los filtros actuales.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <FilterBar
          filters={{ ...filters, section }}
          setFilters={(next) => setFilters({ ...next, section })}
          categories={section === "income" ? incomeSources : section === "pretrip" ? preTripCategories : dailyCategories}
          showSection={false}
        />
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <EmptyState title="Sin movimientos" body="Añade el primero o ajusta los filtros." />
          ) : (
            transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                settings={data.settings}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TravelView({
  data,
  transactions,
  filters,
  setFilters,
  onSubmitTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onSubmitTrip,
  onDeleteTrip
}: {
  data: AppData;
  transactions: Transaction[];
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onSubmitTransaction: (section: Section, draft: TransactionDraft, editing?: Transaction | null) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSubmitTrip: (draft: TripDraft, editing?: TripPlan | null) => void;
  onDeleteTrip: (id: string) => void;
}) {
  const [editingTrip, setEditingTrip] = useState<TripPlan | null>(null);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <TransactionForm section="travel_experience" onSubmit={(draft) => onSubmitTransaction("travel_experience", draft)} />
          <TripPlanForm
            editing={editingTrip}
            onCancel={() => setEditingTrip(null)}
            onSubmit={(draft) => {
              onSubmitTrip(draft, editingTrip);
              setEditingTrip(null);
            }}
          />
        </div>
        <div className="space-y-4">
          <FilterBar
            filters={{ ...filters, section: "travel_experience" }}
            setFilters={(next) => setFilters({ ...next, section: "travel_experience" })}
            categories={travelCategories}
            showSection={false}
          />
          <div className="card">
            <p className="label">Viajes planificados</p>
            <div className="mt-4 space-y-3">
              {data.tripPlans.map((trip) => (
                <TripPlanCard
                  key={trip.id}
                  trip={trip}
                  settings={data.settings}
                  onEdit={setEditingTrip}
                  onDelete={onDeleteTrip}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                settings={data.settings}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsView({
  data,
  calc,
  onSubmit,
  onDelete
}: {
  data: AppData;
  calc: ReturnType<typeof calculateApp>;
  onSubmit: (draft: GoalDraft, editing?: SavingsGoal | null) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const base = data.settings.baseCurrency;

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-5">
        <GoalForm
          editing={editing}
          onCancel={() => setEditing(null)}
          onSubmit={(draft) => {
            onSubmit(draft, editing);
            setEditing(null);
          }}
        />
        <div className="card">
          <p className="label">Dinero libre tras objetivos</p>
          <p className={`mt-2 text-3xl font-bold ${calc.moneyAvailableAfterGoals < 0 ? "text-red-600" : "text-emerald-600"}`}>
            {formatMoney(calc.moneyAvailableAfterGoals, base)}
          </p>
          <p className="mt-1 text-sm text-muted dark:text-slate-400">
            Cuenta balance, dinero ya reservado y lo que falta para completar objetivos.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {calc.goalStats.map((stat) => (
          <GoalCard
            key={stat.goal.id}
            goal={stat.goal}
            settings={data.settings}
            onEdit={setEditing}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function BudgetsView({
  data,
  calc,
  onSubmit,
  onDelete
}: {
  data: AppData;
  calc: ReturnType<typeof calculateApp>;
  onSubmit: (draft: BudgetDraft, editing?: Budget | null) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState<Budget | null>(null);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <BudgetForm
        editing={editing}
        onCancel={() => setEditing(null)}
        onSubmit={(draft) => {
          onSubmit(draft, editing);
          setEditing(null);
        }}
      />
      <div className="space-y-3">
        {calc.budgetUsage.map((item) => (
          <BudgetCard
            key={item.budget.id}
            usage={item}
            currency={data.settings.baseCurrency}
            onEdit={setEditing}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function SettingsView({
  data,
  setData,
  onExport,
  onImport,
  onReset,
  onRemoveSeed,
  onFreshAccount
}: {
  data: AppData;
  setData: (next: AppData | ((current: AppData) => AppData)) => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onRemoveSeed: () => void;
  onFreshAccount: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <SupabaseAccountCard onFreshAccount={onFreshAccount} />
      <div className="card">
        <p className="label">Configuración</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Moneda base">
            <select
              className="field"
              value={data.settings.baseCurrency}
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  settings: { ...current.settings, baseCurrency: event.target.value as Currency }
                }))
              }
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>
          <Field label="Cambio EUR/USD">
            <input
              className="field"
              type="number"
              step="0.01"
              min="0"
              value={data.settings.exchangeRate}
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  settings: { ...current.settings, exchangeRate: Number(event.target.value) || 1 }
                }))
              }
            />
          </Field>
          <Field label="Inicio del viaje">
            <input
              className="field"
              type="date"
              value={data.settings.tripStartDate}
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  settings: { ...current.settings, tripStartDate: event.target.value }
                }))
              }
            />
          </Field>
          <Field label="Fin del viaje">
            <input
              className="field"
              type="date"
              value={data.settings.tripEndDate}
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  settings: { ...current.settings, tripEndDate: event.target.value }
                }))
              }
            />
          </Field>
        </div>
      </div>
      <div className="card">
        <p className="label">Datos</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button className="secondary-button" onClick={onExport}>
            <Download size={18} />
            Exportar JSON
          </button>
          <button className="secondary-button" onClick={onImport}>
            <Upload size={18} />
            Importar JSON
          </button>
          <button className="secondary-button" onClick={onRemoveSeed} disabled={!data.hasSeedData}>
            <FileJson size={18} />
            Borrar ejemplos
          </button>
          <button className="secondary-button border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300" onClick={onReset}>
            <Trash2 size={18} />
            Resetear todo
          </button>
        </div>
        <p className="mt-4 text-sm text-muted dark:text-slate-400">
          Todo se guarda en localStorage del navegador. No se usa base de datos externa.
        </p>
      </div>
    </div>
  );
}

function SupabaseAccountCard({ onFreshAccount }: { onFreshAccount: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function createAccount() {
    if (!supabase) return;
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUser(data.user ?? null);
    onFreshAccount();
    setMessage("Cuenta creada. He puesto todos los datos a 0.");
  }

  async function login() {
    if (!supabase) return;
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    setMessage(error ? error.message : "Sesión iniciada.");
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setMessage("Sesión cerrada.");
  }

  return (
    <div className="card xl:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label">Cuenta Supabase</p>
          <h3 className="mt-1 text-lg font-bold">{user ? user.email : "Crear cuenta o iniciar sesión"}</h3>
          <p className="mt-1 text-sm text-muted dark:text-slate-400">
            Al crear una cuenta nueva, la app limpia los datos de muestra y empieza con todo a cero.
          </p>
        </div>
        {user && (
          <button className="secondary-button" onClick={logout}>
            <LogOut size={18} />
            Salir
          </button>
        )}
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200">
          Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local` para activar el registro.
        </div>
      ) : !user ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@ejemplo.com" />
          <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" />
          <button className="primary-button" onClick={createAccount} disabled={loading || !email || password.length < 6}>
            <UserPlus size={18} />
            Crear
          </button>
          <button className="secondary-button" onClick={login} disabled={loading || !email || !password}>
            <LogIn size={18} />
            Entrar
          </button>
        </div>
      ) : null}

      {message && <p className="mt-3 text-sm font-semibold text-blue-700 dark:text-blue-300">{message}</p>}
    </div>
  );
}

function TransactionForm({
  section,
  editing,
  onSubmit,
  onCancel
}: {
  section: Section;
  editing?: Transaction | null;
  onSubmit: (draft: TransactionDraft) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState(() => transactionDraft(section, editing || undefined));
  const isIncome = section === "income";
  const categories = isIncome ? incomeSources : section === "pretrip" ? preTripCategories : section === "usa_daily" ? dailyCategories : travelCategories;

  useEffect(() => {
    setDraft(transactionDraft(section, editing || undefined));
  }, [editing, section]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(draft);
    if (!editing) setDraft(transactionDraft(section));
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="label">{editing ? "Editar" : "Añadir rápido"}</p>
          <h3 className="mt-1 text-lg font-bold">{sectionLabels[section]}</h3>
        </div>
        {onCancel && (
          <button type="button" className="icon-button" onClick={onCancel}>
            <X size={18} />
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={isIncome ? "Descripción" : "Nombre"}>
          <input className="field" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder={isIncome ? "Primer ingreso" : "Supermercado"} />
        </Field>
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <Field label="Cantidad">
            <input className="field" type="number" step="0.01" min="0" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} placeholder="0.00" required />
          </Field>
          <Field label="Moneda">
            <select className="field" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as Currency })}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>
        </div>
        <Field label="Fecha">
          <input className="field" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
        </Field>
        <Field label={isIncome ? "Fuente" : "Categoría"}>
          <select
            className="field"
            value={isIncome ? draft.source : draft.category}
            onChange={(event) =>
              isIncome ? setDraft({ ...draft, source: event.target.value }) : setDraft({ ...draft, category: event.target.value })
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        {!isIncome && (
          <Field label="Método de pago">
            <select className="field" value={draft.paymentMethod} onChange={(event) => setDraft({ ...draft, paymentMethod: event.target.value })}>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </Field>
        )}
        {section === "pretrip" && (
          <>
            <Field label="Quién lo pagó">
              <select className="field" value={draft.paidBy} onChange={(event) => setDraft({ ...draft, paidBy: event.target.value as TransactionDraft["paidBy"] })}>
                {Object.entries(paidByLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select
                className="field"
                value={draft.repaymentStatus}
                onChange={(event) => setDraft({ ...draft, repaymentStatus: event.target.value as TransactionDraft["repaymentStatus"] })}
              >
                {Object.entries(repaymentLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        {section === "travel_experience" && (
          <Field label="Ciudad o destino">
            <input className="field" value={draft.destination} onChange={(event) => setDraft({ ...draft, destination: event.target.value })} placeholder="Nueva York" />
          </Field>
        )}
        <Field label="Notas">
          <input className="field" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Opcional" />
        </Field>
      </div>
      <button className="primary-button mt-4 w-full" type="submit">
        <Plus size={18} />
        {editing ? "Guardar cambios" : isIncome ? "Añadir ingreso" : "Añadir gasto"}
      </button>
    </form>
  );
}

function GoalForm({
  editing,
  onSubmit,
  onCancel
}: {
  editing: SavingsGoal | null;
  onSubmit: (draft: GoalDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => goalDraft(editing || undefined));

  useEffect(() => setDraft(goalDraft(editing || undefined)), [editing]);

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
        setDraft(goalDraft());
      }}
    >
      <FormHeader title="Objetivo" editing={Boolean(editing)} onCancel={onCancel} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">
          <input className="field" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Volver con 1.000 $" />
        </Field>
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <Field label="Objetivo">
            <input className="field" type="number" step="0.01" min="0" value={draft.targetAmount} onChange={(event) => setDraft({ ...draft, targetAmount: event.target.value })} />
          </Field>
          <Field label="Moneda">
            <select className="field" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as Currency })}>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </Field>
        </div>
        <Field label="Reservado ahora">
          <input className="field" type="number" step="0.01" min="0" value={draft.currentAmount} onChange={(event) => setDraft({ ...draft, currentAmount: event.target.value })} />
        </Field>
        <Field label="Fecha límite">
          <input className="field" type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} />
        </Field>
        <Field label="Prioridad">
          <select className="field" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as SavingsGoal["priority"] })}>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </Field>
        <Field label="Categoría">
          <select className="field" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as SavingsGoal["category"] })}>
            <option value="travel">Viajes</option>
            <option value="return_savings">Ahorro vuelta</option>
            <option value="personal_purchase">Compra personal</option>
            <option value="emergency">Emergencia</option>
            <option value="other">Otro</option>
          </select>
        </Field>
        <Field label="Notas">
          <input className="field" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
        </Field>
      </div>
      <button className="primary-button mt-4 w-full" type="submit">
        <Plus size={18} />
        Guardar objetivo
      </button>
    </form>
  );
}

function TripPlanForm({
  editing,
  onSubmit,
  onCancel
}: {
  editing: TripPlan | null;
  onSubmit: (draft: TripDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => tripDraft(editing || undefined));
  useEffect(() => setDraft(tripDraft(editing || undefined)), [editing]);

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
        setDraft(tripDraft());
      }}
    >
      <FormHeader title="Planificar viaje" editing={Boolean(editing)} onCancel={onCancel} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre del viaje">
          <input className="field" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Fin de semana en NYC" />
        </Field>
        <Field label="Destino">
          <input className="field" value={draft.destination} onChange={(event) => setDraft({ ...draft, destination: event.target.value })} placeholder="Nueva York" />
        </Field>
        <Field label="Inicio">
          <input className="field" type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
        </Field>
        <Field label="Fin">
          <input className="field" type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} />
        </Field>
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <Field label="Presupuesto">
            <input className="field" type="number" step="0.01" min="0" value={draft.estimatedBudget} onChange={(event) => setDraft({ ...draft, estimatedBudget: event.target.value })} />
          </Field>
          <Field label="Moneda">
            <select className="field" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as Currency })}>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </Field>
        </div>
        <Field label="Gasto real">
          <input className="field" type="number" step="0.01" min="0" value={draft.actualSpent} onChange={(event) => setDraft({ ...draft, actualSpent: event.target.value })} />
        </Field>
        <Field label="Estado">
          <select className="field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as TripPlan["status"] })}>
            <option value="planned">Planeado</option>
            <option value="in_progress">En curso</option>
            <option value="completed">Completado</option>
          </select>
        </Field>
        <Field label="Notas">
          <input className="field" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
        </Field>
      </div>
      <button className="primary-button mt-4 w-full" type="submit">
        <Plus size={18} />
        Guardar viaje
      </button>
    </form>
  );
}

function BudgetForm({
  editing,
  onSubmit,
  onCancel
}: {
  editing: Budget | null;
  onSubmit: (draft: BudgetDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => budgetDraft(editing || undefined));
  useEffect(() => setDraft(budgetDraft(editing || undefined)), [editing]);

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
        setDraft(budgetDraft());
      }}
    >
      <FormHeader title="Presupuesto" editing={Boolean(editing)} onCancel={onCancel} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Categoría">
          <select className="field" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
            {budgetCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-[1fr_92px] gap-2">
          <Field label="Máximo">
            <input className="field" type="number" step="0.01" min="0" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} />
          </Field>
          <Field label="Moneda">
            <select className="field" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as Currency })}>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </Field>
        </div>
        <Field label="Periodo">
          <select className="field" value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value as Budget["period"] })}>
            <option value="total">Total</option>
            <option value="monthly">Mensual</option>
            <option value="weekly">Semanal</option>
          </select>
        </Field>
      </div>
      <button className="primary-button mt-4 w-full" type="submit">
        <Plus size={18} />
        Guardar presupuesto
      </button>
    </form>
  );
}

function EditTransactionModal({
  transaction,
  onClose,
  onSave
}: {
  transaction: Transaction;
  onClose: () => void;
  onSave: (section: Section, draft: TransactionDraft, editing?: Transaction | null) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-3 sm:items-center sm:justify-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-soft p-3 dark:bg-slate-950">
        <TransactionForm
          section={transaction.section}
          editing={transaction}
          onCancel={onClose}
          onSubmit={(draft) => onSave(transaction.section, draft, transaction)}
        />
      </div>
    </div>
  );
}

function FilterBar({
  filters,
  setFilters,
  categories,
  showSection = true
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  categories: string[];
  showSection?: boolean;
}) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Filter size={17} />
        Filtros
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input className="field pl-9" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Buscar movimiento" />
        </div>
        {showSection && (
          <select className="field" value={filters.section} onChange={(event) => setFilters({ ...filters, section: event.target.value as Filters["section"] })}>
            <option value="all">Todas las secciones</option>
            {Object.entries(sectionLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        )}
        <select className="field" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <input className="field" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        <input className="field" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
        <button className="secondary-button" onClick={() => setFilters({ ...emptyFilters, section: filters.section })}>
          Limpiar
        </button>
      </div>
    </div>
  );
}

function TransactionRow({
  transaction,
  settings,
  onEdit,
  onDelete
}: {
  transaction: Transaction;
  settings: AppData["settings"];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const baseAmount = toBase(transaction.amount, transaction.currency, settings);
  const isIncome = transaction.type === "income";

  return (
    <div className="rounded-2xl border border-line bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-1 text-xs font-bold ${isIncome ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
              {sectionLabels[transaction.section]}
            </span>
            <span className="text-xs text-muted dark:text-slate-400">{transaction.date}</span>
          </div>
          <h4 className="mt-2 truncate font-bold">{transaction.title}</h4>
          <p className="mt-1 text-sm text-muted dark:text-slate-400">
            {transaction.category}
            {transaction.destination ? ` · ${transaction.destination}` : ""}
            {transaction.paymentMethod ? ` · ${transaction.paymentMethod}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-lg font-black ${isIncome ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"}`}>
            {isIncome ? "+" : "-"}
            {formatMoney(transaction.amount, transaction.currency)}
          </p>
          {transaction.currency !== settings.baseCurrency && (
            <p className="text-xs text-muted dark:text-slate-400">{formatMoney(baseAmount, settings.baseCurrency)}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted dark:text-slate-400">
          {transaction.paidBy ? paidByLabels[transaction.paidBy] : transaction.source || ""}
          {transaction.repaymentStatus && transaction.repaymentStatus !== "not_applicable" ? ` · ${repaymentLabels[transaction.repaymentStatus]}` : ""}
        </p>
        <div className="flex gap-2">
          <button className="icon-button h-9 w-9" title="Editar" onClick={() => onEdit(transaction)}>
            <Edit3 size={16} />
          </button>
          <button className="icon-button h-9 w-9 text-red-600" title="Eliminar" onClick={() => onDelete(transaction.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  settings,
  onEdit,
  onDelete
}: {
  goal: SavingsGoal;
  settings: AppData["settings"];
  onEdit: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}) {
  const progress = goalProgress(goal, settings);
  const missing = Math.max(0, toBase(goal.targetAmount, goal.currency, settings) - toBase(goal.currentAmount, goal.currency, settings));
  const weekly = weeklySavingNeeded(goal, settings);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">{pocketLabels[goal.category] || "Objetivo"}</p>
          <h3 className="mt-1 text-lg font-bold">{goal.name}</h3>
        </div>
        <div className="flex gap-2">
          <button className="icon-button" onClick={() => onEdit(goal)}>
            <Edit3 size={16} />
          </button>
          <button className="icon-button text-red-600" onClick={() => onDelete(goal.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <ProgressBar value={progress} tone={progress >= 70 ? "good" : progress >= 40 ? "warn" : "info"} />
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <MiniStat label="Reservado" value={formatMoney(goal.currentAmount, goal.currency)} />
        <MiniStat label="Falta" value={formatMoney(fromBase(missing, goal.currency, settings), goal.currency)} />
        <MiniStat label="Semana" value={formatMoney(weekly, settings.baseCurrency)} />
      </div>
    </div>
  );
}

function BudgetCard({
  usage,
  currency,
  onEdit,
  onDelete
}: {
  usage: ReturnType<typeof calculateApp>["budgetUsage"][number];
  currency: Currency;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}) {
  const exceeded = usage.percentage >= 100;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">{usage.budget.period === "weekly" ? "Semanal" : usage.budget.period === "monthly" ? "Mensual" : "Total"}</p>
          <h3 className="mt-1 text-lg font-bold">{usage.budget.category}</h3>
        </div>
        <div className="flex gap-2">
          <button className="icon-button" onClick={() => onEdit(usage.budget)}>
            <Edit3 size={16} />
          </button>
          <button className="icon-button text-red-600" onClick={() => onDelete(usage.budget.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <ProgressBar value={usage.percentage} tone={exceeded ? "danger" : usage.percentage > 75 ? "warn" : "good"} />
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold">{formatMoney(usage.spent, currency)} gastado</span>
        <span className={exceeded ? "font-bold text-red-600" : "text-muted dark:text-slate-400"}>
          {Math.round(usage.percentage)}% de {formatMoney(usage.assigned, currency)}
        </span>
      </div>
    </div>
  );
}

function TripPlanCard({
  trip,
  settings,
  onEdit,
  onDelete
}: {
  trip: TripPlan;
  settings: AppData["settings"];
  onEdit: (trip: TripPlan) => void;
  onDelete: (id: string) => void;
}) {
  const estimated = toBase(trip.estimatedBudget, trip.currency, settings);
  const actual = toBase(trip.actualSpent, trip.currency, settings);
  const statusLabel = trip.status === "planned" ? "Planeado" : trip.status === "in_progress" ? "En curso" : "Completado";

  return (
    <div className="rounded-2xl border border-line bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold">{trip.name}</h4>
          <p className="text-sm text-muted dark:text-slate-400">
            {trip.destination} · {trip.startDate} - {trip.endDate}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{statusLabel}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat label="Estimado" value={formatMoney(estimated, settings.baseCurrency)} />
        <MiniStat label="Real" value={formatMoney(actual, settings.baseCurrency)} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="icon-button h-9 w-9" onClick={() => onEdit(trip)}>
          <Edit3 size={16} />
        </button>
        <button className="icon-button h-9 w-9 text-red-600" onClick={() => onDelete(trip.id)}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function HeroMoneyCard({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: "good" | "tight" | "bad" }) {
  const toneClass = tone === "good" ? "from-emerald-500 to-blue-600" : tone === "tight" ? "from-orange-500 to-blue-600" : "from-red-500 to-orange-500";
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${toneClass} p-5 text-white md:col-span-2 xl:col-span-1`}>
      <p className="text-sm font-semibold text-white/80">{title}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm font-medium text-white/85">{detail}</p>
    </div>
  );
}

function MetricCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: "good" | "warn" | "danger" | "info" }) {
  const styles = {
    good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    warn: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
  };
  return (
    <div className="card">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${styles[tone]}`}>{icon}</div>
      <p className="mt-4 text-sm font-semibold text-muted dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Insight({ tone, title, body }: { tone: "good" | "warn" | "danger" | "info"; title: string; body: string }) {
  const styles = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
    warn: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200",
    danger: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
  };
  return (
    <div className={`rounded-2xl border p-3 ${styles[tone]}`}>
      <div className="flex items-center gap-2 font-bold">
        {tone === "good" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
        {title}
      </div>
      <p className="mt-1 text-sm opacity-85">{body}</p>
    </div>
  );
}

function PocketRow({ label, value, total, currency, strong = false }: { label: string; value: number; total: number; currency: Currency; strong?: boolean }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span className={strong ? "font-bold" : "font-semibold"}>{label}</span>
        <span className="font-bold">{formatMoney(value, currency)}</span>
      </div>
      <ProgressBar value={percentage} tone={strong ? "good" : "info"} />
    </div>
  );
}

function ProgressBar({ value, tone }: { value: number; tone: "good" | "warn" | "danger" | "info" }) {
  const color = tone === "good" ? "bg-emerald-500" : tone === "warn" ? "bg-orange-500" : tone === "danger" ? "bg-red-500" : "bg-blue-500";
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-xs font-semibold text-muted dark:text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black sm:text-base">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "good" | "tight" | "bad" }) {
  const label = status === "good" ? "Voy bien" : status === "tight" ? "Voy justo" : "Voy mal";
  const className =
    status === "good"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : status === "tight"
        ? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
        : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${className}`}>{label}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function FormHeader({ title, editing, onCancel }: { title: string; editing: boolean; onCancel: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="label">{editing ? "Editar" : "Crear"}</p>
        <h3 className="mt-1 text-lg font-bold">{title}</h3>
      </div>
      {editing && (
        <button className="icon-button" type="button" onClick={onCancel}>
          <X size={18} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card text-center">
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted dark:text-slate-400">{body}</p>
    </div>
  );
}

function periodSpend(transactions: Transaction[], settings: AppData["settings"], period: "weekly" | "monthly") {
  const now = new Date();
  return transactions
    .filter((item) => item.type === "expense")
    .filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);
      if (period === "monthly") {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      }
      const current = new Date(now.toDateString());
      const day = current.getDay() || 7;
      const monday = new Date(current);
      monday.setDate(current.getDate() - day + 1);
      return date >= monday && date <= current;
    })
    .reduce((total, item) => total + toBase(item.amount, item.currency, settings), 0);
}
