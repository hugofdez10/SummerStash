import { defaultSettings, emptyData } from "./seed";
import { supabase } from "./supabase";
import type { AppData } from "./types";

const CLOUD_TABLE = "user_app_data";

function normalizeData(data: Partial<AppData> | null | undefined): AppData {
  return {
    transactions: data?.transactions || [],
    goals: data?.goals || [],
    tripPlans: data?.tripPlans || [],
    budgets: data?.budgets || [],
    settings: { ...defaultSettings, ...data?.settings },
    hasSeedData: Boolean(data?.hasSeedData)
  };
}

export function stripSeedData(data: AppData): AppData {
  return {
    ...data,
    transactions: data.transactions.filter((item) => !item.id.startsWith("seed-")),
    goals: data.goals.filter((item) => !item.id.startsWith("seed-")),
    tripPlans: data.tripPlans.filter((item) => !item.id.startsWith("seed-")),
    budgets: data.budgets.filter((item) => !item.id.startsWith("seed-")),
    hasSeedData: false
  };
}

export function hasSeedRecords(data: AppData) {
  return (
    data.hasSeedData ||
    data.transactions.some((item) => item.id.startsWith("seed-")) ||
    data.goals.some((item) => item.id.startsWith("seed-")) ||
    data.tripPlans.some((item) => item.id.startsWith("seed-")) ||
    data.budgets.some((item) => item.id.startsWith("seed-"))
  );
}

export function accountStartData(localData: AppData): AppData {
  const withoutSeeds = stripSeedData(localData);
  const hasUserData =
    withoutSeeds.transactions.length > 0 ||
    withoutSeeds.goals.length > 0 ||
    withoutSeeds.tripPlans.length > 0 ||
    withoutSeeds.budgets.length > 0;

  if (hasUserData) {
    return withoutSeeds;
  }

  return {
    ...emptyData,
    settings: {
      ...defaultSettings,
      ...localData.settings
    },
    hasSeedData: false
  };
}

export async function loadCloudData(userId: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(CLOUD_TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.data ? normalizeData(data.data as Partial<AppData>) : null;
}

export async function saveCloudData(userId: string, data: AppData) {
  if (!supabase) return;

  const { error } = await supabase.from(CLOUD_TABLE).upsert({
    user_id: userId,
    data: normalizeData(data),
    updated_at: new Date().toISOString()
  });

  if (error) throw error;
}
