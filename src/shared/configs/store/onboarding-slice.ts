import { db } from "@/shared/configs/db";
import { maxStep, nextStep } from "@/shared/utils/setup-steps";

import type { OnboardingSettings } from "@/shared/types/domain.types";

import type { OnboardingSlice, SliceCreator } from "./types";

export const createOnboardingSlice: SliceCreator<OnboardingSlice> = (set, get) => ({
  onboardingStep: "identity",
  onboardingLastCompletedStep: null,
  onboardingGroupId: null,
  onboardingComplete: false,

  updateOnboarding: async (patch) => {
    const { onboardingLastCompletedStep, onboardingGroupId, onboardingComplete } = get();
    const record: OnboardingSettings = {
      id: "onboarding",
      lastCompletedStep: onboardingLastCompletedStep,
      groupId: onboardingGroupId,
      complete: onboardingComplete,
      ...patch,
    };
    await db.settings.put(record);
    set({
      onboardingLastCompletedStep: record.lastCompletedStep,
      onboardingGroupId: record.groupId,
      onboardingComplete: record.complete,
    });
  },

  advanceOnboarding: async (fromStep) => {
    await get().updateOnboarding({
      lastCompletedStep: maxStep(get().onboardingLastCompletedStep, fromStep),
    });
    set({ onboardingStep: nextStep(fromStep) });
  },

  setOnboardingStep: (step) => {
    set({ onboardingStep: step });
  },
});
