import type { SetupStep } from "@/shared/types/domain.types";

export const SETUP_STEPS: SetupStep[] = ["identity", "group", "currency", "categories", "members"];

export const nextStep = (step: SetupStep): SetupStep =>
  SETUP_STEPS[Math.min(SETUP_STEPS.indexOf(step) + 1, SETUP_STEPS.length - 1)];

export const prevStep = (step: SetupStep): SetupStep =>
  SETUP_STEPS[Math.max(SETUP_STEPS.indexOf(step) - 1, 0)];

// The step to view, given the furthest completed step (null = nothing done yet).
export const stepAfter = (lastCompleted: SetupStep | null): SetupStep =>
  lastCompleted === null ? SETUP_STEPS[0] : nextStep(lastCompleted);

// The later of two steps by flow order; keeps the completed frontier monotonic.
export const maxStep = (a: SetupStep | null, b: SetupStep): SetupStep =>
  a === null ? b : SETUP_STEPS.indexOf(a) >= SETUP_STEPS.indexOf(b) ? a : b;
