import { describe, expect, it } from "vitest";

import {
  CREATE_GROUP_STEP_FIELDS,
  CREATE_GROUP_STEPS,
  createGroupSchema,
} from "@/features/create-group/helpers/schema";

const createValidValues = () => ({
  group: { name: "Goa Trip", icon: "🏖️" },
  currency: "INR",
  categories: [{ id: "category-1", name: "Food", icon: "🍽️" }],
  members: [
    {
      id: "member-1",
      personId: "person-1",
      name: "Alex",
      icon: "🙂",
    },
  ],
});

type ValidValues = ReturnType<typeof createValidValues>;

interface InvalidCase {
  label: string;
  expectedMessage: string;
  mutate: (values: ValidValues) => void;
}

const INVALID_CASES: InvalidCase[] = [
  {
    label: "blank group name",
    expectedMessage: "Group name is required",
    mutate: (values) => {
      values.group.name = "   ";
    },
  },
  {
    label: "blank group icon",
    expectedMessage: "Group icon is required",
    mutate: (values) => {
      values.group.icon = "\t";
    },
  },
  {
    label: "blank currency",
    expectedMessage: "Currency is required",
    mutate: (values) => {
      values.currency = "\n";
    },
  },
  {
    label: "no categories",
    expectedMessage: "Select at least one category",
    mutate: (values) => {
      values.categories = [];
    },
  },
  {
    label: "blank category name",
    expectedMessage: "Category name is required",
    mutate: (values) => {
      values.categories[0].name = "   ";
    },
  },
  {
    label: "blank category icon",
    expectedMessage: "Category icon is required",
    mutate: (values) => {
      values.categories[0].icon = "\u00a0";
    },
  },
  {
    label: "blank member name",
    expectedMessage: "Member name is required",
    mutate: (values) => {
      values.members[0].name = "\t";
    },
  },
  {
    label: "blank member icon",
    expectedMessage: "Member icon is required",
    mutate: (values) => {
      values.members[0].icon = "\u3000";
    },
  },
];

describe("createGroupSchema", () => {
  it("trims every user-provided string while preserving IDs", () => {
    const values = createValidValues();
    values.group = { name: "  Goa   Trip  ", icon: "  🏖️  " };
    values.currency = "  INR  ";
    values.categories[0] = {
      id: "category-1",
      name: "  Food & Drinks  ",
      icon: "  🍽️  ",
    };
    values.members[0] = {
      id: "member-1",
      personId: "person-1",
      name: "  Alex Doe  ",
      icon: "  🙂  ",
    };

    expect(createGroupSchema.parse(values)).toEqual({
      group: { name: "Goa   Trip", icon: "🏖️" },
      currency: "INR",
      categories: [{ id: "category-1", name: "Food & Drinks", icon: "🍽️" }],
      members: [
        {
          id: "member-1",
          personId: "person-1",
          name: "Alex Doe",
          icon: "🙂",
        },
      ],
    });
  });

  it("allows a solo group with no optional members", () => {
    const values = createValidValues();
    values.members = [];

    expect(createGroupSchema.safeParse(values).success).toBe(true);
  });

  it.each(INVALID_CASES)("rejects $label", ({ expectedMessage, mutate }) => {
    const values = createValidValues();
    mutate(values);

    const result = createGroupSchema.safeParse(values);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(expectedMessage);
    }
  });
});

describe("create-group step configuration", () => {
  it("defines every step in flow order", () => {
    expect(CREATE_GROUP_STEPS).toEqual(["group", "currency", "categories", "members"]);
  });

  it("maps each step to only its own form section", () => {
    expect(CREATE_GROUP_STEP_FIELDS).toEqual({
      group: ["group"],
      currency: ["currency"],
      categories: ["categories"],
      members: ["members"],
    });
  });
});
