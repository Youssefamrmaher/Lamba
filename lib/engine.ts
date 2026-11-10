/**
 * Watt Pet tier engine.
 * Pure functions only: no Date.now(), no localStorage, no React.
 * Every function that needs prices takes a tariff table (defaults to data/tariffs.json),
 * so the Settings screen can pass an edited table later.
 */
import tariffData from "@/data/tariffs.json";

export interface Tier {
  tier: number;
  /** Inclusive upper bound of the bracket in kWh; null = no upper limit. */
  maxKwh: number | null;
  /** EGP per kWh. */
  rate: number;
  /** When true, the whole month is billed at this rate (not cumulative). */
  flat?: boolean;
}

export interface TariffTable {
  currency: string;
  year: number;
  tiers: Tier[];
}

export type Mood = "calm" | "alert" | "panic" | "proud" | "sleepy";

export const DEFAULT_TARIFFS: TariffTable = tariffData as TariffTable;

/** Share of the threshold that counts as "close": within 15% → alert. */
export const ALERT_MARGIN = 0.15;
/** Days without a reading before Lamba gets sleepy. */
export const SLEEPY_AFTER_DAYS = 2;

const MS_PER_DAY = 86_400_000;
const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Usage & forecast
// ---------------------------------------------------------------------------

/** kWh used this cycle. Never negative (guards against typos / meter swaps). */
export function usedSoFar(todayReading: number, cycleStartReading: number): number {
  return Math.max(0, todayReading - cycleStartReading);
}

/** Average kWh per day. Returns 0 when no full day has elapsed yet. */
export function dailyAverage(used: number, daysElapsed: number): number {
  if (daysElapsed <= 0) return 0;
  return used / daysElapsed;
}

/** Projected kWh for the whole cycle at the current pace. */
export function forecastKwh(avgPerDay: number, daysInCycle: number): number {
  return avgPerDay * daysInCycle;
}

// ---------------------------------------------------------------------------
// Tiers & bill
// ---------------------------------------------------------------------------

function sortedTiers(t: TariffTable): Tier[] {
  return [...t.tiers].sort((a, b) => a.tier - b.tier);
}

/** Tier object that a monthly total of `kWh` falls into. */
export function tierInfo(kWh: number, tariffs: TariffTable = DEFAULT_TARIFFS): Tier {
  const tiers = sortedTiers(tariffs);
  const kwh = Math.max(0, kWh);
  return tiers.find((t) => t.maxKwh === null || kwh <= t.maxKwh) ?? tiers[tiers.length - 1];
}

/** Tier number (1–7 with the default table) for a monthly total. */
export function tierFor(kWh: number, tariffs: TariffTable = DEFAULT_TARIFFS): number {
  return tierInfo(kWh, tariffs).tier;
}

/** Rate (EGP/kWh) of the tier a monthly total falls into. */
export function rateFor(kWh: number, tariffs: TariffTable = DEFAULT_TARIFFS): number {
  return tierInfo(kWh, tariffs).rate;
}

/**
 * Estimated bill in EGP for a monthly total.
 * Non-flat tiers (1–6): each kWh is billed at its own bracket's rate (cumulative).
 * Flat tier (7): every kWh of the month is billed at that tier's rate.
 */
export function estimateBill(kWh: number, tariffs: TariffTable = DEFAULT_TARIFFS): number {
  // TODO: verify cumulative rules against official ministry tariff
  const kwh = Math.max(0, kWh);
  const current = tierInfo(kwh, tariffs);
  if (current.flat) return round2(kwh * current.rate);

  let bill = 0;
  let lower = 0;
  for (const t of sortedTiers(tariffs)) {
    if (t.flat) break;
    const upper = t.maxKwh ?? Infinity;
    const inBracket = Math.min(kwh, upper) - lower;
    if (inBracket <= 0) break;
    bill += inBracket * t.rate;
    lower = upper;
  }
  return round2(bill);
}

/** The next tier above the one `kWh` is in, or null when already in the top tier. */
export function nextTier(kWh: number, tariffs: TariffTable = DEFAULT_TARIFFS): Tier | null {
  const current = tierInfo(kWh, tariffs);
  return sortedTiers(tariffs).find((t) => t.tier > current.tier) ?? null;
}

/**
 * kWh left before the total moves into the next tier (i.e. room left in the current tier).
 * Returns null in the top tier.
 */
export function kwhToNextTier(kWh: number, tariffs: TariffTable = DEFAULT_TARIFFS): number | null {
  const current = tierInfo(kWh, tariffs);
  if (current.maxKwh === null) return null;
  return round2(Math.max(0, current.maxKwh - Math.max(0, kWh)));
}

/**
 * How much the bill jumps by when the monthly total crosses into the next tier:
 * bill(first kWh of next tier) − bill(last kWh of current tier).
 * Under purely cumulative brackets this is small (one kWh at the new rate);
 * at the flat tier boundary (1000 → 1001) it is large because the whole month reprices.
 * Returns null in the top tier.
 */
export function extraCostAtNextTier(kWh: number, tariffs: TariffTable = DEFAULT_TARIFFS): number | null {
  const current = tierInfo(kWh, tariffs);
  if (current.maxKwh === null) return null;
  const threshold = current.maxKwh;
  return round2(estimateBill(threshold + 1, tariffs) - estimateBill(threshold, tariffs));
}

// ---------------------------------------------------------------------------
// Prepaid & appliances
// ---------------------------------------------------------------------------

/**
 * Days the prepaid balance lasts: balance ÷ (dailyAverage × current rate).
 * Returns null when there is no usage yet (can't estimate).
 */
export function daysLeft(balance: number, avgPerDay: number, currentRate: number): number | null {
  const perDay = avgPerDay * currentRate;
  if (perDay <= 0) return null;
  return Math.max(0, Math.floor(balance / perDay));
}

/** EGP per hour of running an appliance at a given rate. */
export function applianceCostPerHour(watts: number, rate: number): number {
  return (Math.max(0, watts) / 1000) * rate;
}

// ---------------------------------------------------------------------------
// Billing cycle (dates are passed in, never read from the clock)
// ---------------------------------------------------------------------------

function utcDay(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole calendar days from `from` to `to` (local dates, DST-safe). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((utcDay(to) - utcDay(from)) / MS_PER_DAY);
}

/** Clamp a start day to a month's length (startDay 31 in February → 28/29). */
function dayInMonth(year: number, month: number, day: number): Date {
  const last = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, last));
}

export interface Cycle {
  start: Date;
  /** First day of the next cycle (exclusive end). */
  end: Date;
  daysInCycle: number;
}

/**
 * The billing cycle containing `today`, given the day of month it starts on.
 * Prepaid meters use startDay = 1 (calendar month).
 */
export function cycleFor(today: Date, startDay: number): Cycle {
  const y = today.getFullYear();
  const m = today.getMonth();
  let start = dayInMonth(y, m, startDay);
  if (utcDay(today) < utcDay(start)) start = dayInMonth(y, m - 1, startDay);
  const end = dayInMonth(start.getFullYear(), start.getMonth() + 1, startDay);
  return { start, end, daysInCycle: daysBetween(start, end) };
}

// ---------------------------------------------------------------------------
// Lamba mood
// ---------------------------------------------------------------------------

/**
 * Forecast-only mood, relative to the threshold of the tier we're in right now.
 * calm:  forecast at least 15% below the threshold
 * alert: forecast within 15% of the threshold (or already in the top tier)
 * panic: forecast crosses the threshold
 */
export function forecastMood(
  usedKwh: number,
  forecast: number,
  tariffs: TariffTable = DEFAULT_TARIFFS,
): "calm" | "alert" | "panic" {
  const current = tierInfo(usedKwh, tariffs);
  if (current.maxKwh === null) return "alert";
  const threshold = current.maxKwh;
  if (forecast > threshold) return "panic";
  if (forecast >= threshold * (1 - ALERT_MARGIN)) return "alert";
  return "calm";
}

/** Proud: the cycle ended in the tier forecast at mid-month, or lower. */
export function isProud(finalTier: number, midMonthForecastTier: number): boolean {
  return finalTier <= midMonthForecastTier;
}

/** Sleepy: no reading for 2+ days. */
export function isSleepy(lastReadingDate: Date, today: Date): boolean {
  return daysBetween(lastReadingDate, today) >= SLEEPY_AFTER_DAYS;
}

export interface MoodInput {
  usedKwh: number;
  forecast: number;
  lastReadingDate: Date;
  today: Date;
  /** Set when the previous cycle just closed and we know how it ended. */
  lastCycle?: { finalTier: number; midMonthForecastTier: number; justEnded: boolean };
  tariffs?: TariffTable;
}

/** Priority: sleepy → proud (right after a good cycle) → panic / alert / calm. */
export function pickMood(input: MoodInput): Mood {
  const { usedKwh, forecast, lastReadingDate, today, lastCycle, tariffs = DEFAULT_TARIFFS } = input;
  if (isSleepy(lastReadingDate, today)) return "sleepy";
  if (lastCycle?.justEnded && isProud(lastCycle.finalTier, lastCycle.midMonthForecastTier)) {
    return "proud";
  }
  return forecastMood(usedKwh, forecast, tariffs);
}
