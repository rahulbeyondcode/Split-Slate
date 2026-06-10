import { z } from "zod";

import {
  CREATE_GROUP_STEP_FIELDS,
  createGroupSchema,
} from "@/features/create-group/helpers/schema";

import type { SetupStep } from "@/shared/types/domain.types";

// Onboarding = the shared create-group steps plus an identity step.
// Each step reads/writes its own slice via form context; the parent validates one slice at a time before advancing.

export const setupSchema = createGroupSchema.extend({
  identity: z.object({
    name: z.string().min(1, "Name is required"),
    icon: z.string(),
  }),
});

export type SetupFormValues = z.infer<typeof setupSchema>;

// Fields validated (via trigger) before each step's Save and Proceed.
export const STEP_FIELDS: Record<SetupStep, (keyof SetupFormValues)[]> = {
  identity: ["identity"],
  ...CREATE_GROUP_STEP_FIELDS,
};
