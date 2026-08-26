import { describe, expect, it } from "vitest";

import { setupSchema, STEP_FIELDS } from "@/features/onboarding/helpers/setup-schema";

const createValidValues = () => ({
  identity: { name: "Rahul", icon: "🙂" },
  group: { name: "Goa Trip", icon: "🏖️" },
  currency: "INR",
  categories: [{ name: "Food", icon: "🍽️" }],
  members: [],
});

describe("setupSchema", () => {
  it("trims identity values and every inherited group-building string", () => {
    const values = createValidValues();
    values.identity = { name: "  Rahul Kumar  ", icon: "  🙂  " };
    values.group = { name: "  Goa Trip  ", icon: "  🏖️  " };
    values.currency = "  INR  ";
    values.categories[0] = { name: "  Food  ", icon: "  🍽️  " };

    expect(setupSchema.parse(values)).toEqual({
      identity: { name: "Rahul Kumar", icon: "🙂" },
      group: { name: "Goa Trip", icon: "🏖️" },
      currency: "INR",
      categories: [{ name: "Food", icon: "🍽️" }],
      members: [],
    });
  });

  it.each([
    [
      "identity name",
      "Name is required",
      (values: ReturnType<typeof createValidValues>) => {
        values.identity.name = "   ";
      },
    ],
    [
      "identity icon",
      "Icon is required",
      (values: ReturnType<typeof createValidValues>) => {
        values.identity.icon = "\t";
      },
    ],
    [
      "inherited group name",
      "Group name is required",
      (values: ReturnType<typeof createValidValues>) => {
        values.group.name = "\n";
      },
    ],
    [
      "inherited currency",
      "Currency is required",
      (values: ReturnType<typeof createValidValues>) => {
        values.currency = "\u00a0";
      },
    ],
    [
      "inherited categories",
      "Select at least one category",
      (values: ReturnType<typeof createValidValues>) => {
        values.categories = [];
      },
    ],
  ] as const)("rejects a blank or missing %s", (_, expectedMessage, mutate) => {
    const values = createValidValues();
    mutate(values);

    const result = setupSchema.safeParse(values);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(expectedMessage);
    }
  });

  it("allows onboarding to finish without optional additional members", () => {
    expect(setupSchema.safeParse(createValidValues()).success).toBe(true);
  });
});

describe("onboarding step fields", () => {
  it("maps every setup step to only its own form section", () => {
    expect(STEP_FIELDS).toEqual({
      identity: ["identity"],
      group: ["group"],
      currency: ["currency"],
      categories: ["categories"],
      members: ["members"],
    });
  });
});
