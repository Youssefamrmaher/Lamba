import { describe, expect, it } from "vitest";
import {
  DEFAULT_TARIFFS,
  applianceCostPerHour,
  cycleFor,
  dailyAverage,
  daysBetween,
  daysLeft,
  estimateBill,
  extraCostAtNextTier,
  forecastKwh,
  forecastMood,
  isProud,
  isSleepy,
  kwhToNextTier,
  pickMood,
  rateFor,
  tierFor,
  usedSoFar,
  type TariffTable,
} from "./engine";

const d = (iso: string) => new Date(`${iso}T12:00:00`);

describe("usage & forecast", () => {
  it("usedSoFar = today − cycle start, never negative", () => {
    expect(usedSoFar(1250, 1100)).toBe(150);
    expect(usedSoFar(1000, 1100)).toBe(0);
  });

  it("dailyAverage divides by days elapsed, 0 on day zero", () => {
    expect(dailyAverage(150, 10)).toBe(15);
    expect(dailyAverage(20, 0)).toBe(0);
  });

  it("forecastKwh = dailyAverage × days in cycle", () => {
    expect(forecastKwh(15, 30)).toBe(450);
  });
});

describe("tierFor", () => {
  it.each([
    [0, 1], [50, 1], [50.5, 2], [51, 2], [100, 2], [101, 3], [200, 3],
    [201, 4], [350, 4], [351, 5], [650, 5], [651, 6], [1000, 6], [1001, 7], [5000, 7],
  ])("%d kWh → tier %d", (kwh, tier) => {
    expect(tierFor(kwh)).toBe(tier);
  });

  it("treats negative input as 0", () => {
    expect(tierFor(-10)).toBe(1);
  });

  it("rateFor returns the tier's rate", () => {
    expect(rateFor(120)).toBe(1.15);
    expect(rateFor(1500)).toBe(2.74);
  });
});

describe("estimateBill", () => {
  it.each([
    [0, 0],
    [50, 34], // 50 × 0.68
    [100, 81.5], // + 50 × 0.95
    [120, 104.5], // + 20 × 1.15
    [200, 196.5],
    [350, 454.5],
    [650, 1108.5],
    [1000, 1948.5],
  ])("cumulative tiers 1–6: %d kWh → EGP %d", (kwh, egp) => {
    expect(estimateBill(kwh)).toBeCloseTo(egp, 2);
  });

  it("tier 7 bills every kWh at 2.74", () => {
    expect(estimateBill(1001)).toBeCloseTo(2742.74, 2);
    expect(estimateBill(1200)).toBeCloseTo(3288, 2);
  });

  it("uses an edited tariff table when one is passed", () => {
    const edited: TariffTable = {
      ...DEFAULT_TARIFFS,
      tiers: DEFAULT_TARIFFS.tiers.map((t) => (t.tier === 1 ? { ...t, rate: 1 } : t)),
    };
    expect(estimateBill(50, edited)).toBe(50);
    expect(estimateBill(50)).toBe(34); // default untouched
  });
});

describe("next tier", () => {
  it("kwhToNextTier is the room left in the current tier", () => {
    expect(kwhToNextTier(312)).toBe(38);
    expect(kwhToNextTier(350)).toBe(0);
    expect(kwhToNextTier(0)).toBe(50);
    expect(kwhToNextTier(1200)).toBeNull();
  });

  it("extraCostAtNextTier is the bill jump when crossing the threshold", () => {
    expect(extraCostAtNextTier(312)).toBeCloseTo(2.18, 2); // 350 → 351, cumulative
    expect(extraCostAtNextTier(900)).toBeCloseTo(794.24, 2); // 1000 → 1001, whole month repriced
    expect(extraCostAtNextTier(1200)).toBeNull();
  });
});

describe("prepaid & appliances", () => {
  it("daysLeft = balance ÷ (dailyAverage × rate), floored", () => {
    expect(daysLeft(100, 5, 1.15)).toBe(17); // 100 / 5.75 = 17.39
    expect(daysLeft(0, 5, 1.15)).toBe(0);
  });

  it("daysLeft is null with no usage yet", () => {
    expect(daysLeft(100, 0, 1.15)).toBeNull();
  });

  it("applianceCostPerHour = watts ÷ 1000 × rate", () => {
    expect(applianceCostPerHour(1500, 2.18)).toBeCloseTo(3.27, 5);
    expect(applianceCostPerHour(10, 0.68)).toBeCloseTo(0.0068, 5);
  });
});

describe("billing cycle", () => {
  it("daysBetween counts calendar days", () => {
    expect(daysBetween(d("2026-11-01"), d("2026-11-10"))).toBe(9);
    expect(daysBetween(d("2026-03-28"), d("2026-04-02"))).toBe(5); // across DST in many zones
  });

  it("cycle starting on the 15th", () => {
    const c = cycleFor(d("2026-11-10"), 15);
    expect(c.start.getDate()).toBe(15);
    expect(c.start.getMonth()).toBe(9); // October
    expect(c.daysInCycle).toBe(31);
  });

  it("calendar month for prepaid (startDay 1)", () => {
    const c = cycleFor(d("2026-11-10"), 1);
    expect(c.start.getMonth()).toBe(10);
    expect(c.daysInCycle).toBe(30);
  });

  it("start day 31 clamps to short months", () => {
    const c = cycleFor(d("2026-02-10"), 31);
    expect(c.start.getMonth()).toBe(0); // Jan 31
    expect(c.end.getDate()).toBe(28); // Feb 28
    expect(c.daysInCycle).toBe(28);
  });
});

describe("Lamba mood", () => {
  // used 120 kWh → tier 3, next threshold 200; alert zone starts at 170
  it("calm when forecast is at least 15% below the threshold", () => {
    expect(forecastMood(120, 150)).toBe("calm");
    expect(forecastMood(120, 169.9)).toBe("calm");
  });

  it("alert when forecast is within 15% of the threshold", () => {
    expect(forecastMood(120, 170)).toBe("alert");
    expect(forecastMood(120, 200)).toBe("alert");
  });

  it("panic when forecast crosses the threshold", () => {
    expect(forecastMood(120, 201)).toBe("panic");
  });

  it("alert (not panic) once already in the top tier", () => {
    expect(forecastMood(1100, 1500)).toBe("alert");
  });

  it("proud when the cycle ended in the forecast tier or lower", () => {
    expect(isProud(4, 4)).toBe(true);
    expect(isProud(3, 4)).toBe(true);
    expect(isProud(5, 4)).toBe(false);
  });

  it("sleepy after 2+ days without a reading", () => {
    expect(isSleepy(d("2026-11-09"), d("2026-11-10"))).toBe(false);
    expect(isSleepy(d("2026-11-08"), d("2026-11-10"))).toBe(true);
  });

  it("pickMood priority: sleepy > proud > forecast", () => {
    const base = { usedKwh: 120, forecast: 250, today: d("2026-11-10") };
    expect(pickMood({ ...base, lastReadingDate: d("2026-11-10") })).toBe("panic");
    expect(pickMood({ ...base, lastReadingDate: d("2026-11-07") })).toBe("sleepy");
    expect(
      pickMood({
        ...base,
        lastReadingDate: d("2026-11-10"),
        lastCycle: { finalTier: 3, midMonthForecastTier: 4, justEnded: true },
      }),
    ).toBe("proud");
    expect(
      pickMood({
        ...base,
        lastReadingDate: d("2026-11-10"),
        lastCycle: { finalTier: 5, midMonthForecastTier: 4, justEnded: true },
      }),
    ).toBe("panic");
  });
});
