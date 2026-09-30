import { describe, expect, it } from "vitest";

import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayTime,
} from "@/shared/utils/date-time";

describe("date and time display", () => {
  it("shows a local date with a padded day and abbreviated month", () => {
    expect(formatDisplayDate(new Date(2026, 0, 2))).toBe("02-Jan-2026");
    expect(formatDisplayDate(new Date(2026, 11, 12))).toBe("12-Dec-2026");
  });

  it("shows padded 12-hour time at midnight, noon, and in the afternoon", () => {
    expect(formatDisplayTime(new Date(2026, 0, 2, 0, 5))).toBe("12:05 AM");
    expect(formatDisplayTime(new Date(2026, 0, 2, 12, 0))).toBe("12:00 PM");
    expect(formatDisplayTime(new Date(2026, 0, 2, 15, 7))).toBe("03:07 PM");
    expect(formatDisplayDateTime(new Date(2026, 0, 12, 15, 7))).toBe("12-Jan-2026 · 03:07 PM");
  });
});
