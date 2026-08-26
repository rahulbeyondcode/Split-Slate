import { z } from "zod";

import { createRequiredStringSchema } from "@/shared/utils/string-validation";

// Shared form schema for the group-building steps (group → currency → categories → members).
// Onboarding extends this with an `identity` slice; the standalone create-group flow uses it as-is.

export const createGroupSchema = z.object({
  group: z.object({
    name: createRequiredStringSchema("Group name is required"),
    icon: createRequiredStringSchema("Group icon is required"),
  }),
  currency: createRequiredStringSchema("Currency is required"),
  categories: z
    .array(
      z.object({
        id: z.string().optional(),
        name: createRequiredStringSchema("Category name is required"),
        icon: createRequiredStringSchema("Category icon is required"),
      }),
    )
    .min(1, "Select at least one category"),
  members: z.array(
    z.object({
      id: z.string().optional(),
      personId: z.string().optional(),
      name: createRequiredStringSchema("Member name is required"),
      icon: createRequiredStringSchema("Member icon is required"),
    }),
  ),
});

export type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export type CreateGroupStep = "group" | "currency" | "categories" | "members";

export const CREATE_GROUP_STEPS: CreateGroupStep[] = ["group", "currency", "categories", "members"];

// Fields validated (via trigger) before each step advances.
export const CREATE_GROUP_STEP_FIELDS: Record<CreateGroupStep, (keyof CreateGroupFormValues)[]> = {
  group: ["group"],
  currency: ["currency"],
  categories: ["categories"],
  members: ["members"],
};
