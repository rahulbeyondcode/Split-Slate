import StepCategories from "@/features/onboarding/components/setup-flow/step-categories";
import StepCurrency from "@/features/onboarding/components/setup-flow/step-currency";
import StepGroup from "@/features/onboarding/components/setup-flow/step-group";
import StepIdentity from "@/features/onboarding/components/setup-flow/step-identity";
import StepMembers from "@/features/onboarding/components/setup-flow/step-members";
import PortalContainer from "@/shared/components/portal/portal-container";

import { useFinishOnboarding } from "@/features/onboarding/hooks/use-finish-onboarding";
import { useStore } from "@/shared/configs/store";
import { prevStep, SETUP_STEPS } from "@/shared/utils/setup-steps";

const SetupFlow = () => {
  const {
    onboardingStep,
    onboardingGroupId,
    setOnboardingStep,
    advanceOnboarding,
    categories,
    members,
  } = useStore();
  const finishOnboarding = useFinishOnboarding();

  const currentIndex = SETUP_STEPS.indexOf(onboardingStep);

  // Skip is offered only while the step is still empty — once something is added, Next/Done takes over.
  const hasCategories = categories.some((c) => c.groupId === onboardingGroupId);
  // The creator is always exactly one member, so >1 means at least one added member.
  const hasAddedMembers = members.filter((m) => m.groupId === onboardingGroupId).length > 1;
  const showSkip =
    (onboardingStep === "categories" && !hasCategories) ||
    (onboardingStep === "members" && !hasAddedMembers);

  const handleBack = () => setOnboardingStep(prevStep(onboardingStep));

  const handleSkip = () => {
    if (onboardingStep === "categories") advanceOnboarding("categories");
    else if (onboardingStep === "members") finishOnboarding();
  };

  return (
    <div className="flex flex-col h-svh p-6 max-w-md mx-auto">
      <div className="flex gap-1 mb-8">
        {SETUP_STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${i <= currentIndex ? "bg-gray-900" : "bg-gray-200"}`}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {onboardingStep === "identity" && <StepIdentity />}
        {onboardingStep === "group" && <StepGroup />}
        {onboardingStep === "currency" && <StepCurrency />}
        {onboardingStep === "categories" && <StepCategories />}
        {onboardingStep === "members" && <StepMembers />}
      </div>

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={handleBack}
          className={`px-4 py-2 text-sm ${currentIndex === 0 ? "invisible" : ""}`}
        >
          Back
        </button>
        <div className="flex gap-2 items-center">
          {showSkip && (
            <button type="button" onClick={handleSkip} className="px-4 py-2 text-sm text-gray-500">
              Skip
            </button>
          )}
          <PortalContainer id="next-btn-slot" />
        </div>
      </div>
    </div>
  );
};

export default SetupFlow;
