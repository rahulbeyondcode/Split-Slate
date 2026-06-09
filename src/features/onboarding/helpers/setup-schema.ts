import { z } from "zod";

import type { SetupStep } from "@/shared/types/domain.types";

// Central form for the whole setup flow. Each step reads/writes its own slice via form context; the parent validates one slice at a time before advancing.

export const setupSchema = z.object({
  identity: z.object({
    name: z.string().min(1, "Name is required"),
    icon: z.string(),
  }),
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

export type SetupFormValues = z.infer<typeof setupSchema>;

// Fields validated (via trigger) before each step's Save and Proceed.
export const STEP_FIELDS: Record<SetupStep, (keyof SetupFormValues)[]> = {
  identity: ["identity"],
  group: ["group"],
  currency: ["currency"],
  categories: ["categories"],
  members: ["members"],
};
