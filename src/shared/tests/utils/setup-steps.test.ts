import { describe, expect, it } from "vitest";

import { maxStep, nextStep, prevStep, SETUP_STEPS, stepAfter } from "@/shared/utils/setup-steps";

import type { SetupStep } from "@/shared/types/domain.types";

const EXPECTED_SETUP_STEPS: SetupStep[] = [
  "identity",
  "group",
  "currency",
  "categories",
  "members",
];

const NEXT_STEP_CASES: [SetupStep, SetupStep][] = [
  ["identity", "group"],
  ["group", "currency"],
  ["currency", "categories"],
  ["categories", "members"],
  ["members", "members"],
];

const PREV_STEP_CASES: [SetupStep, SetupStep][] = [
  ["identity", "identity"],
  ["group", "identity"],
  ["currency", "group"],
  ["categories", "currency"],
  ["members", "categories"],
];

const STEP_AFTER_CASES: [SetupStep | null, SetupStep][] = [
  [null, "identity"],
  ["identity", "group"],
  ["group", "currency"],
  ["currency", "categories"],
  ["categories", "members"],
  ["members", "members"],
];

const MAX_STEP_CASES: [SetupStep | null, SetupStep, SetupStep][] = [
  ...EXPECTED_SETUP_STEPS.map((step): [SetupStep | null, SetupStep, SetupStep] => [
    null,
    step,
    step,
  ]),
  ...EXPECTED_SETUP_STEPS.flatMap((currentStep, currentIndex) =>
    EXPECTED_SETUP_STEPS.map(
      (candidateStep, candidateIndex): [SetupStep | null, SetupStep, SetupStep] => [
        currentStep,
        candidateStep,
        EXPECTED_SETUP_STEPS[Math.max(currentIndex, candidateIndex)],
      ],
    ),
  ),
];

describe("SETUP_STEPS", () => {
  it("defines the complete onboarding sequence in order", () => {
    expect(SETUP_STEPS).toEqual(EXPECTED_SETUP_STEPS);
  });
});

describe("nextStep", () => {
  it.each(NEXT_STEP_CASES)("moves %s forward to %s", (currentStep, expectedStep) => {
    expect(nextStep(currentStep)).toBe(expectedStep);
  });
});

describe("prevStep", () => {
  it.each(PREV_STEP_CASES)("moves %s back to %s", (currentStep, expectedStep) => {
    expect(prevStep(currentStep)).toBe(expectedStep);
  });
});

describe("stepAfter", () => {
  it.each(STEP_AFTER_CASES)(
    "returns $1 after the last completed step is $0",
    (lastCompletedStep, expectedStep) => {
      expect(stepAfter(lastCompletedStep)).toBe(expectedStep);
    },
  );
});

describe("maxStep", () => {
  it.each(MAX_STEP_CASES)(
    "keeps the later step between $0 and $1",
    (currentStep, candidateStep, expectedStep) => {
      expect(maxStep(currentStep, candidateStep)).toBe(expectedStep);
    },
  );
});
