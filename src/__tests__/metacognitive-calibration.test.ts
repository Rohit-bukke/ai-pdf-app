import { describe, it, expect } from "vitest";

describe("Metacognitive Calibration & Mastery Algorithms", () => {
  function computeCalibrationDelta(isCorrect: boolean, confidence: "LOW" | "MEDIUM" | "HIGH") {
    if (confidence === "HIGH") {
      return isCorrect ? 18 : -22; // Severe penalty for overconfidence
    } else if (confidence === "MEDIUM") {
      return isCorrect ? 10 : -10;
    } else {
      return isCorrect ? 5 : -5;
    }
  }

  it("penalizes high confidence wrong answers significantly more than calibrated guesses", () => {
    const highConfidenceMistakeDelta = computeCalibrationDelta(false, "HIGH");
    const lowConfidenceMistakeDelta = computeCalibrationDelta(false, "LOW");

    expect(highConfidenceMistakeDelta).toBe(-22);
    expect(lowConfidenceMistakeDelta).toBe(-5);
    expect(Math.abs(highConfidenceMistakeDelta)).toBeGreaterThan(Math.abs(lowConfidenceMistakeDelta));
  });

  it("rewards calibrated high confidence correct answers", () => {
    const highConfidenceCorrectDelta = computeCalibrationDelta(true, "HIGH");
    expect(highConfidenceCorrectDelta).toBe(18);
  });
});
