import { describe, expect, it } from "vitest";

import { createPersonSchema } from "@/features/people/helpers/schema";

describe("createPersonSchema", () => {
  it("trims user-provided values and preserves internal spaces", () => {
    const schema = createPersonSchema([]);

    expect(schema.parse({ name: "  Alex   Doe  ", icon: "  🙂  " })).toEqual({
      name: "Alex   Doe",
      icon: "🙂",
    });
  });

  it.each([
    ["name", { name: "   ", icon: "🙂" }, "Name is required"],
    ["icon", { name: "Alex", icon: "\t" }, "Icon is required"],
  ] as const)("rejects a blank %s", (_, values, expectedMessage) => {
    const result = createPersonSchema([]).safeParse(values);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(expectedMessage);
    }
  });

  it.each(["alex", " ALEX ", "\tAlex\n"])(
    "rejects the case-insensitive normalized duplicate %j",
    (name) => {
      const result = createPersonSchema(["  Alex  "]).safeParse({ name, icon: "🙂" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Someone with this name already exists");
      }
    },
  );

  it("allows a distinct name", () => {
    expect(createPersonSchema(["Alex"]).safeParse({ name: "Alexa", icon: "🙂" }).success).toBe(
      true,
    );
  });
});
