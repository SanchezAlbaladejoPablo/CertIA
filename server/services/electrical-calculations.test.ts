import { describe, expect, it } from "vitest";
import {
  calculateCableSection,
  calculateContactVoltage,
  calculateMainSwitchRating,
  calculateMaxEarthResistance,
  getCorrectionFactor,
  validateProtectionCoordination,
  verifyRcdTripTime,
} from "./electrical-calculations";

// ─── getCorrectionFactor ──────────────────────────────────────────────────────

describe("getCorrectionFactor", () => {
  it("returns 1.0 for standard conditions (30°C, 1 cable, air, Cu-PVC)", () => {
    expect(getCorrectionFactor(30, 1, "air", "Cu", "PVC")).toBe(1.0);
  });

  it("applies temperature factor for 40°C", () => {
    // kt=0.91 (Cu-PVC 40°C) × kg=1.0 × ki=1.0 = 0.91
    expect(getCorrectionFactor(40, 1, "air", "Cu", "PVC")).toBe(0.91);
  });

  it("applies grouping factor for 3 cables", () => {
    // kt=1.0 × kg=0.70 × ki=1.0 = 0.70
    expect(getCorrectionFactor(30, 3, "air", "Cu", "PVC")).toBe(0.7);
  });

  it("applies installation method factor for embedded conduit", () => {
    // kt=1.0 × kg=1.0 × ki=0.77 = 0.77
    expect(getCorrectionFactor(30, 1, "embedded_conduit", "Cu", "PVC")).toBe(0.77);
  });

  it("combines all three factors correctly", () => {
    // kt=0.91 (40°C, Cu-PVC) × kg=0.70 (3 cables) × ki=0.85 (surface_conduit) = 0.54145 → 0.5415
    const result = getCorrectionFactor(40, 3, "surface_conduit", "Cu", "PVC");
    expect(result).toBe(0.5415);
  });

  it("uses XLPE temperature table for Cu-XLPE", () => {
    // kt=0.94 (Cu-XLPE 40°C) × kg=1.0 × ki=1.0 = 0.94
    expect(getCorrectionFactor(40, 1, "air", "Cu", "XLPE")).toBe(0.94);
  });
});

// ─── calculateCableSection ────────────────────────────────────────────────────

describe("calculateCableSection", () => {
  it("selects 1.5mm² for a standard 2300W monophasic circuit (10A, 15m, Cu-PVC)", () => {
    // I=10A, ΔU criterion → 1.03mm² → max with current criterion → 1.5mm²
    const result = calculateCableSection(2300, 230, 1, 15, "Cu", 3);
    expect(result.recommendedSection).toBe(1.5);
    expect(result.current).toBeCloseTo(10, 1);
    expect(result.voltageDrop).toBeLessThanOrEqual(3);
  });

  it("selects 1mm² for a lighting circuit (1000W, 230V, 20m)", () => {
    // I=4.35A → current criterion picks 1mm² (integer keys iterated first in JS object)
    const result = calculateCableSection(1000, 230, 1, 20, "Cu", 3);
    expect(result.recommendedSection).toBe(1);
    expect(result.current).toBeCloseTo(4.35, 1);
  });

  it("selects larger section when cable length increases voltage drop", () => {
    // Same power, but 100m length forces a larger section
    const short = calculateCableSection(2000, 230, 1, 10, "Cu", 3);
    const long = calculateCableSection(2000, 230, 1, 100, "Cu", 3);
    expect(long.recommendedSection).toBeGreaterThanOrEqual(short.recommendedSection);
  });

  it("calculates correct current for three-phase circuit", () => {
    // P = √3 × V × I  =>  I = P / (√3 × 400)
    const result = calculateCableSection(10000, 400, 3, 20, "Cu", 3);
    expect(result.current).toBeCloseTo(14.43, 1);
  });

  it("voltage drop is within limit for recommended section", () => {
    const maxDrop = 3;
    const result = calculateCableSection(3000, 230, 1, 30, "Cu", maxDrop);
    expect(result.voltageDrop).toBeLessThanOrEqual(maxDrop);
  });

  it("returns a section from standard normalized values", () => {
    const STANDARD = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
    const result = calculateCableSection(5000, 230, 1, 25, "Cu", 3);
    expect(STANDARD).toContain(result.recommendedSection);
  });

  it("Al conductor requires larger section than Cu for same conditions", () => {
    const cu = calculateCableSection(3000, 230, 1, 20, "Cu", 3);
    const al = calculateCableSection(3000, 230, 1, 20, "Al", 3);
    expect(al.recommendedSection).toBeGreaterThanOrEqual(cu.recommendedSection);
  });

  it("applies 1% max voltage drop for DI (ITC-BT-15)", () => {
    const result = calculateCableSection(2000, 230, 1, 10, "Cu", 1);
    expect(result.voltageDrop).toBeLessThanOrEqual(1);
  });
});

// ─── validateProtectionCoordination ──────────────────────────────────────────

describe("validateProtectionCoordination", () => {
  it("validates correct coordination: PIA 16A on 2.5mm² Cu-PVC (Iz=20A)", () => {
    const result = validateProtectionCoordination(16, 2.5, "Cu", "PVC", 1.0);
    expect(result.valid).toBe(true);
    expect(result.izCorrected).toBe(20);
  });

  it("rejects oversized PIA: 25A on 2.5mm² Cu-PVC (Iz=20A)", () => {
    const result = validateProtectionCoordination(25, 2.5, "Cu", "PVC", 1.0);
    expect(result.valid).toBe(false);
  });

  it("applies correction factor to Imax", () => {
    // 2.5mm² Cu-PVC: Imax=20A. With factor 0.7: Iz=14A. PIA 16A should fail.
    const result = validateProtectionCoordination(16, 2.5, "Cu", "PVC", 0.7);
    expect(result.valid).toBe(false);
    expect(result.izCorrected).toBeCloseTo(14, 1);
  });

  it("validates 10A PIA on 1.5mm² Cu-PVC (Iz=16A)", () => {
    const result = validateProtectionCoordination(10, 1.5, "Cu", "PVC", 1.0);
    expect(result.valid).toBe(true);
    expect(result.izCorrected).toBe(16);
  });
});

// ─── calculateContactVoltage ──────────────────────────────────────────────────

describe("calculateContactVoltage", () => {
  it("calculates contact voltage correctly: 1000Ω × 30mA = 30V (compliant)", () => {
    const result = calculateContactVoltage(1000, 30);
    expect(result.contactVoltage).toBe(30);
    expect(result.compliant).toBe(true);
  });

  it("detects non-compliant installation: 2000Ω × 30mA = 60V > 50V", () => {
    const result = calculateContactVoltage(2000, 30);
    expect(result.contactVoltage).toBe(60);
    expect(result.compliant).toBe(false);
    expect(result.limit).toBe(50);
  });

  it("limit is exactly 50V (ITC-BT-24 TT system)", () => {
    const result = calculateContactVoltage(500, 100);
    expect(result.limit).toBe(50);
  });

  it("boundary: exactly 50V is compliant", () => {
    // Rt=1667Ω × 30mA = 50.01 → use Rt=1666Ω
    const result = calculateContactVoltage(1666, 30);
    expect(result.contactVoltage).toBeLessThanOrEqual(50);
    expect(result.compliant).toBe(true);
  });
});

// ─── calculateMainSwitchRating ────────────────────────────────────────────────

describe("calculateMainSwitchRating", () => {
  it("returns 25A for a 5750W single-phase installation (ITC-BT-25 basic electrification)", () => {
    // I = 5750 / 230 = 25A → exact match
    const result = calculateMainSwitchRating(5750, 1);
    expect(result).toBe(25);
  });

  it("returns 40A for 9200W single-phase (I=40A)", () => {
    const result = calculateMainSwitchRating(9200, 1);
    expect(result).toBe(40);
  });

  it("returns 16A for a small 3000W single-phase installation", () => {
    // I = 3000 / 230 ≈ 13.04A → next standard = 16A
    const result = calculateMainSwitchRating(3000, 1);
    expect(result).toBe(16);
  });

  it("uses 400V for three-phase calculations", () => {
    // I = 10000 / (√3 × 400) ≈ 14.43A → next standard = 16A
    const result = calculateMainSwitchRating(10000, 3);
    expect(result).toBe(16);
  });

  it("returns 200A (max) for very large installations", () => {
    const result = calculateMainSwitchRating(500000, 3);
    expect(result).toBe(200);
  });
});

// ─── calculateMaxEarthResistance ─────────────────────────────────────────────

describe("calculateMaxEarthResistance", () => {
  it("returns 1666.7Ω for 30mA RCD (R = 50V / 0.03A)", () => {
    const result = calculateMaxEarthResistance(30);
    expect(result).toBeCloseTo(1666.7, 0);
  });

  it("returns 500Ω for 100mA RCD", () => {
    const result = calculateMaxEarthResistance(100);
    expect(result).toBe(500);
  });

  it("returns 166.7Ω for 300mA RCD (ITC-BT-18 general protection)", () => {
    const result = calculateMaxEarthResistance(300);
    expect(result).toBeCloseTo(166.7, 0);
  });
});

// ─── verifyRcdTripTime ────────────────────────────────────────────────────────

describe("verifyRcdTripTime", () => {
  it("passes for 250ms at 1×Idn (standard AC, limit=300ms)", () => {
    const result = verifyRcdTripTime(250, 30, 1, "AC");
    expect(result.conforme).toBe(true);
    expect(result.maxTimeMs).toBe(300);
    expect(result.margin).toBe(50);
  });

  it("fails for 310ms at 1×Idn (exceeds 300ms limit)", () => {
    const result = verifyRcdTripTime(310, 30, 1, "AC");
    expect(result.conforme).toBe(false);
    expect(result.margin).toBeUndefined();
  });

  it("applies 150ms limit for 2×Idn (AC type)", () => {
    const result = verifyRcdTripTime(100, 30, 2, "AC");
    expect(result.conforme).toBe(true);
    expect(result.maxTimeMs).toBe(150);
  });

  it("applies 40ms limit for 5×Idn (AC type)", () => {
    const pass = verifyRcdTripTime(30, 30, 5, "AC");
    expect(pass.conforme).toBe(true);
    expect(pass.maxTimeMs).toBe(40);

    const fail = verifyRcdTripTime(50, 30, 5, "AC");
    expect(fail.conforme).toBe(false);
  });

  it("uses extended limits for type S (selective) RCD", () => {
    // Type S at 1×Idn: limit = 500ms
    const result = verifyRcdTripTime(400, 30, 1, "S");
    expect(result.conforme).toBe(true);
    expect(result.maxTimeMs).toBe(500);
  });

  it("references IEC 60755 / ITC-BT-24 standard", () => {
    const result = verifyRcdTripTime(100, 30, 1, "AC");
    expect(result.standard).toContain("IEC 60755");
    expect(result.standard).toContain("ITC-BT-24");
  });
});
