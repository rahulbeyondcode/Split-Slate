import { describe, expect, it } from "vitest";

import {
  createRequiredStringSchema,
  normalizeRequiredString,
} from "@/shared/utils/string-validation";

const BLANK_STRINGS = [
  ["empty", ""],
  ["spaces", "   "],
  ["tab", "\t"],
  ["newlines", "\n\r"],
  ["non-breaking space", "\u00a0"],
  ["ideographic space", "\u3000"],
] as const;

describe("createRequiredStringSchema", () => {
  const schema = createRequiredStringSchema("Value is required");

  it("trims surrounding whitespace and preserves internal spaces", () => {
    expect(schema.parse("  Goa   Trip  ")).toBe("Goa   Trip");
  });

  it.each(BLANK_STRINGS)("rejects a %s-only value", (_, value) => {
    const result = schema.safeParse(value);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Value is required");
    }
  });
});

describe("normalizeRequiredString", () => {
  it("returns a trimmed value without collapsing internal spaces", () => {
    expect(normalizeRequiredString("  Goa   Trip  ", "Value is required")).toBe("Goa   Trip");
  });

  it.each(BLANK_STRINGS)("rejects a %s-only value", (_, value) => {
    expect(() => normalizeRequiredString(value, "Value is required")).toThrow("Value is required");
  });
});
