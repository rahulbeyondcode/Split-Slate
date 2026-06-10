import { z } from "zod";

// Shared form schema for the group-building steps (group → currency → categories → members).
// Onboarding extends this with an `identity` slice; the standalone create-group flow uses it as-is.

export const createGroupSchema = z.object({
  group: z.object({
    name: z.string().min(1, "Group name is required"),
    icon: z.string(),
  }),
  currency: z.string().min(1),
  categories: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        icon: z.string(),
      }),
    )
    .min(1, "Select at least one category"),
  members: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      icon: z.string(),
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
