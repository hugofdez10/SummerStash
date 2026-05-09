import { STORAGE_KEY } from "./constants";
import { initialData } from "./seed";
import type { AppData } from "./types";

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function loadData(): AppData {
  if (typeof window === "undefined") {
    return initialData;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialData;
    }

    return { ...initialData, ...JSON.parse(raw) } as AppData;
  } catch {
    return initialData;
  }
}

export function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
