import { describe, expect, it } from "vitest";
import { APPLIANCES, buildAppData, isValidStartDay, parseAmount, parseBalance, parseReading } from "./onboarding";
import { isAppData } from "./storage";

describe("parseAmount", () => {
  it("reads plain and decimal numbers", () => {
    expect(parseAmount("1250")).toBe(1250);
    expect(parseAmount(" 12.5 ")).toBe(12.5);
    expect(parseAmount("12,5")).toBe(12.5);
  });

  it("reads Arabic-Indic digits and the Arabic decimal mark", () => {
    expect(parseAmount("١٢٥٠")).toBe(1250);
    expect(parseAmount("١٢٫٥")).toBe(12.5);
  });

  it("rejects junk, negatives and empty input", () => {
    for (const bad of ["", "abc", "-5", "1.2.3", "12a", "."]) expect(parseAmount(bad)).toBeNull();
  });
});

describe("range checks", () => {
  it("reading fits a 6-digit meter", () => {
    expect(parseReading("999999")).toBe(999999);
    expect(parseReading("1000000")).toBeNull();
  });

  it("balance is capped", () => {
    expect(parseBalance("0")).toBe(0);
    expect(parseBalance("100001")).toBeNull();
  });

  it("start day is 1–31", () => {
    expect(isValidStartDay(1)).toBe(true);
    expect(isValidStartDay(31)).toBe(true);
    expect(isValidStartDay(0)).toBe(false);
    expect(isValidStartDay(32)).toBe(false);
    expect(isValidStartDay(null)).toBe(false);
  });
});

describe("buildAppData", () => {
  const now = new Date("2026-11-10T09:00:00Z");

  it("postpaid keeps the billing day and no balance", () => {
    const d = buildAppData(
      { meterType: "postpaid", billingStartDay: 15, prepaidBalance: 99, firstReading: 4321, applianceIds: ["ac", "tv"] },
      now,
      "2026-11-10",
    );
    expect(d.profile.billingStartDay).toBe(15);
    expect(d.profile.prepaidBalance).toBeNull();
    expect(d.profile.appliances).toEqual([
      { id: "ac", watts: 1200 },
      { id: "tv", watts: 100 },
    ]);
    expect(d.readings).toEqual([{ date: "2026-11-10", kwh: 4321 }]);
    expect(isAppData(d)).toBe(true);
  });

  it("prepaid uses the calendar month and keeps the balance", () => {
    const d = buildAppData(
      { meterType: "prepaid", billingStartDay: 20, prepaidBalance: 150, firstReading: 10, applianceIds: [] },
      now,
      "2026-11-10",
    );
    expect(d.profile.billingStartDay).toBe(1);
    expect(d.profile.prepaidBalance).toBe(150);
    expect(d.profile.appliances).toEqual([]);
  });

  it("ignores unknown appliance ids", () => {
    const d = buildAppData(
      { meterType: "postpaid", billingStartDay: 1, prepaidBalance: null, firstReading: 1, applianceIds: ["spaceship"] },
      now,
      "2026-11-10",
    );
    expect(d.profile.appliances).toEqual([]);
  });

  it("every appliance has a name in both languages", () => {
    for (const a of APPLIANCES) {
      expect(a.name.en).toBeTruthy();
      expect(a.name.ar).toBeTruthy();
    }
  });
});

describe("isAppData", () => {
  it("rejects corrupt data", () => {
    expect(isAppData(null)).toBe(false);
    expect(isAppData({ version: 2 })).toBe(false);
    expect(isAppData({ version: 1, profile: { meterType: "solar" }, readings: [] })).toBe(false);
  });
});
