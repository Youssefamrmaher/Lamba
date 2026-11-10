/** Pure helpers for the onboarding form. No React, no storage. */
import applianceData from "@/data/appliances.json";
import type { AppData, MeterType } from "./storage";

export interface ApplianceDef {
  id: string;
  emoji: string;
  watts: number;
  name: { en: string; ar: string };
}

export const APPLIANCES: ApplianceDef[] = applianceData.appliances;

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Parse a number typed by the user. Accepts Arabic-Indic digits (٠–٩),
 * the Arabic decimal separator (٫) and a comma as decimal point.
 * Returns null for anything that isn't a plain non-negative number.
 */
export function parseAmount(input: string): number | null {
  const normalized = input
    .trim()
    .replace(/[٠-٩]/g, (ch) => String(ARABIC_DIGITS.indexOf(ch)))
    .replace(/[٫,]/g, ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Meter readings: 0 to 999,999 kWh (six-digit meter display). */
export function parseReading(input: string): number | null {
  const n = parseAmount(input);
  return n !== null && n <= 999_999 ? n : null;
}

/** Prepaid balance in EGP: 0 to 100,000. */
export function parseBalance(input: string): number | null {
  const n = parseAmount(input);
  return n !== null && n <= 100_000 ? n : null;
}

export function isValidStartDay(day: number | null): day is number {
  return day !== null && Number.isInteger(day) && day >= 1 && day <= 31;
}

export interface OnboardingAnswers {
  meterType: MeterType;
  billingStartDay: number | null;
  prepaidBalance: number | null;
  firstReading: number;
  applianceIds: string[];
}

/** Turn finished onboarding answers into the saved app data. */
export function buildAppData(a: OnboardingAnswers, now: Date, dateKey: string): AppData {
  const prepaid = a.meterType === "prepaid";
  return {
    version: 1,
    profile: {
      meterType: a.meterType,
      billingStartDay: prepaid ? 1 : (a.billingStartDay ?? 1),
      prepaidBalance: prepaid ? (a.prepaidBalance ?? 0) : null,
      appliances: APPLIANCES.filter((d) => a.applianceIds.includes(d.id)).map((d) => ({
        id: d.id,
        watts: d.watts,
      })),
      createdAt: now.toISOString(),
    },
    readings: [{ date: dateKey, kwh: a.firstReading }],
  };
}
