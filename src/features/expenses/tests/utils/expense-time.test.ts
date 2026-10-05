import { describe, expect, it } from "vitest";

import { composeLocalDateTime, parseLocalDateTime } from "@/shared/utils/date-time-input";

describe("expense time", () => {
  it.each([
    ["2026-09-19T00:05", "12", "05", "AM"],
    ["2026-09-19T12:30", "12", "30", "PM"],
    ["2026-09-19T18:30", "06", "30", "PM"],
    ["2026-09-19T11:59", "11", "59", "AM"],
  ] as const)("shows %s as %s:%s %s and converts back", (value, hour, minute, period) => {
    const parts = parseLocalDateTime(value);
    expect(parts).toEqual({ date: "2026-09-19", hour, minute, period });
    expect(composeLocalDateTime(parts)).toBe(value);
  });

  it("pads single digits and switches between AM and PM", () => {
    expect(composeLocalDateTime({ date: "2026-09-19", hour: "1", minute: "5", period: "PM" })).toBe(
      "2026-09-19T13:05",
    );
    expect(
      composeLocalDateTime({ date: "2026-09-19", hour: "12", minute: "0", period: "AM" }),
    ).toBe("2026-09-19T00:00");
  });

  it("rejects incomplete or out-of-range times", () => {
    for (const [hour, minute] of [
      ["", "00"],
      ["0", "00"],
      ["13", "00"],
      ["12", "60"],
      ["12", "a"],
    ]) {
      expect(composeLocalDateTime({ date: "2026-09-19", hour, minute, period: "AM" })).toBe(
        "invalid",
      );
    }
    expect(composeLocalDateTime({ date: "", hour: "12", minute: "00", period: "AM" })).toBe("");
  });
});
