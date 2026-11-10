/**
 * Everything the app saves lives under one localStorage key.
 * Reads never throw: private mode, blocked storage or corrupt data all come back as null.
 */
export type MeterType = "prepaid" | "postpaid";

export interface Reading {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  kwh: number;
}

export interface ApplianceSetting {
  id: string;
  watts: number;
}

export interface Profile {
  meterType: MeterType;
  /** Day of month the billing cycle starts. Prepaid meters use 1 (calendar month). */
  billingStartDay: number;
  /** EGP on the prepaid card at onboarding; null for postpaid. */
  prepaidBalance: number | null;
  appliances: ApplianceSetting[];
  createdAt: string;
}

export interface AppData {
  version: 1;
  profile: Profile;
  readings: Reading[];
}

export const STORAGE_KEY = "wattpet:v1";

const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

export function isAppData(x: unknown): x is AppData {
  if (!x || typeof x !== "object") return false;
  const d = x as AppData;
  const p = d.profile;
  return (
    d.version === 1 &&
    !!p &&
    (p.meterType === "prepaid" || p.meterType === "postpaid") &&
    isNum(p.billingStartDay) &&
    (p.prepaidBalance === null || isNum(p.prepaidBalance)) &&
    Array.isArray(p.appliances) &&
    p.appliances.every((a) => typeof a?.id === "string" && isNum(a.watts)) &&
    Array.isArray(d.readings) &&
    d.readings.every((r) => typeof r?.date === "string" && isNum(r.kwh))
  );
}

export function loadData(): AppData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isAppData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Returns false when the browser refuses to store (e.g. storage full or blocked). */
export function saveData(data: AppData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearData(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing stored, nothing to clear
  }
}

/** YYYY-MM-DD for the local calendar day. */
export function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
