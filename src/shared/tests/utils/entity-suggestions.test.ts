import { describe, expect, it } from "vitest";

import { entitySuggestions } from "@/shared/utils/entity-suggestions";

import type { Category, Group, Tag } from "@/shared/types/domain.types";

const groups: Group[] = [
  { id: "one", name: "First Trip", icon: "✦", currency: "INR", createdAt: 1, frequentPayerIds: [] },
  {
    id: "two",
    name: "Second Trip",
    icon: "✦",
    currency: "INR",
    createdAt: 2,
    frequentPayerIds: [],
  },
  {
    id: "three",
    name: "Third Trip",
    icon: "✦",
    currency: "INR",
    createdAt: 3,
    frequentPayerIds: [],
  },
];
const categories: Category[] = [
  { id: "fuel1", groupId: "one", name: "Expense_of_fuel", icon: "⛽", isActive: true },
  { id: "fuel2", groupId: "two", name: "Expense_of_fuel", icon: "⛽", isActive: true },
  { id: "petrol", groupId: "two", name: "Petrol Expense", icon: "🚗", isActive: true },
  { id: "local", groupId: "three", name: "Fuel costs", icon: "🏕️", isActive: true },
];

describe("entitySuggestions", () => {
  it("matches from the first letter anywhere in a name and lists every source group", () => {
    const result = entitySuggestions(categories, groups, "f", "three", []);
    expect(result.find((item) => item.name === "Expense_of_fuel")).toEqual({
      name: "Expense_of_fuel",
      icon: "⛽",
      color: undefined,
      groupNames: ["First Trip", "Second Trip"],
    });
    expect(result.some((item) => item.name === "Fuel costs")).toBe(false);
    expect(
      entitySuggestions(categories, groups, "fuel", "three", []).map((item) => item.name),
    ).toContain("Expense_of_fuel");
  });

  it("matches punctuation/case variants while preserving the exact suggested spelling", () => {
    expect(entitySuggestions(categories, groups, "petrol_expense", "three", [])[0].name).toBe(
      "Petrol Expense",
    );
    expect(entitySuggestions(categories, groups, "pEtRoL", "three", [])[0].name).toBe(
      "Petrol Expense",
    );
  });

  it("excludes unavailable names, missing groups, and blank queries", () => {
    expect(entitySuggestions(categories, groups, "fuel", "three", [" expense_of_fuel "])).toEqual(
      [],
    );
    expect(entitySuggestions(categories, groups, "_", "three", [])).toEqual([]);
    expect(entitySuggestions(categories, groups.slice(2), "fuel", "three", [])).toEqual([]);
  });

  it("uses tag colors and keeps distinct color variants as separate suggestions", () => {
    const tags: Tag[] = [
      { id: "t1", groupId: "one", name: "Fuel-Expense", color: "#112233" },
      { id: "t2", groupId: "two", name: "Fuel-Expense", color: "#112233" },
      { id: "t3", groupId: "three", name: "Fuel-Expense", color: "#445566" },
    ];
    expect(entitySuggestions(tags, groups, "expense", undefined, [])).toEqual([
      {
        name: "Fuel-Expense",
        icon: undefined,
        color: "#112233",
        groupNames: ["First Trip", "Second Trip"],
      },
      { name: "Fuel-Expense", icon: undefined, color: "#445566", groupNames: ["Third Trip"] },
    ]);
  });
});
