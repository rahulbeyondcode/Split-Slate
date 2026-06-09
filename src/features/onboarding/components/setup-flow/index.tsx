import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import StepCategories from "@/features/onboarding/components/setup-flow/step-categories";
import StepCurrency from "@/features/onboarding/components/setup-flow/step-currency";
import StepGroup from "@/features/onboarding/components/setup-flow/step-group";
import StepIdentity from "@/features/onboarding/components/setup-flow/step-identity";
import StepMembers from "@/features/onboarding/components/setup-flow/step-members";

import { useFinishOnboarding } from "@/features/onboarding/hooks/use-finish-onboarding";
import { useStore } from "@/shared/configs/store";
import { prevStep, SETUP_STEPS } from "@/shared/utils/setup-steps";
import {
  type SetupFormValues,
  setupSchema,
  STEP_FIELDS,
} from "@/features/onboarding/helpers/setup-schema";

import { GROUP_EMOJIS, PERSON_EMOJIS } from "@/shared/constants/emojis";

const SetupFlow = () => {
  const {
    localUser,
    groups,
    members,
    categories,
    masterCategories,
    defaultGroupCategories,
    onboardingStep,
    onboardingGroupId,
    setOnboardingStep,
    advanceOnboarding,
    setLocalUser,
    createGroup,
    updateGroup,
    updateOnboarding,
    addCategory,
    removeCategory,
    addMember,
  } = useStore();
  const finishOnboarding = useFinishOnboarding();
  const [saving, setSaving] = useState(false);

  const group = groups.find((grp) => grp.id === onboardingGroupId);
  const creatorId = group?.frequentPayerIds[0];
  const existingCategories = categories
    .filter((category) => category.groupId === onboardingGroupId)
    .map((category) => ({ id: category.id, name: category.name, icon: category.icon }));
  const defaultCategories = defaultGroupCategories.map((name) => ({
    name,
    icon: masterCategories.find((master) => master.name === name)?.icon ?? "",
  }));
  const existingMembers = members
    .filter((member) => member.groupId === onboardingGroupId && member.id !== creatorId)
    .map((member) => ({ id: member.id, name: member.name, icon: member.icon }));

  const methods = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      identity: { name: localUser?.name ?? "", icon: localUser?.icon ?? PERSON_EMOJIS[0] },
      group: { name: group?.name ?? "", icon: group?.icon ?? GROUP_EMOJIS[0] },
      currency: group?.currency ?? "INR",
      categories: existingCategories.length ? existingCategories : defaultCategories,
      members: existingMembers,
    },
  });

  const currentIndex = SETUP_STEPS.indexOf(onboardingStep);
  const isLast = onboardingStep === "members";

  const handleBack = () => setOnboardingStep(prevStep(onboardingStep));

  const persistCategories = async (categoryList: SetupFormValues["categories"]) => {
    if (!group) return;
    const existingForGroup = categories.filter((category) => category.groupId === group.id);
    for (const category of categoryList) {
      if (!existingForGroup.some((existing) => existing.name === category.name))
        await addCategory(group.id, category.name, category.icon);
    }
    for (const existing of existingForGroup) {
      if (!categoryList.some((category) => category.name === existing.name))
        await removeCategory(existing.id);
    }
  };

  const persistMembers = async (memberList: SetupFormValues["members"]) => {
    if (!group) return;
    for (const member of memberList) {
      if (!member.id) await addMember(group.id, member.name, member.icon);
    }
  };

  const handleSaveAndProceed = async () => {
    const valid = await methods.trigger(STEP_FIELDS[onboardingStep]);
    if (!valid) return;

    const formValues = methods.getValues();
    setSaving(true);
    try {
      switch (onboardingStep) {
        case "identity":
          await setLocalUser(formValues.identity.name, formValues.identity.icon);
          await advanceOnboarding("identity");
          break;
        case "group":
          if (group) {
            await updateGroup(group.id, {
              name: formValues.group.name,
              icon: formValues.group.icon,
            });
          } else {
            const { group: createdGroup } = await createGroup(
              formValues.group.name,
              formValues.group.icon,
              formValues.currency,
            );
            await updateOnboarding({ groupId: createdGroup.id });
          }
          await advanceOnboarding("group");
          break;
        case "currency":
          if (group) await updateGroup(group.id, { currency: formValues.currency });
          await advanceOnboarding("currency");
          break;
        case "categories":
          await persistCategories(formValues.categories);
          await advanceOnboarding("categories");
          break;
        case "members":
          await persistMembers(formValues.members);
          await finishOnboarding();
          break;
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-svh p-6 max-w-md mx-auto">
        <div className="flex gap-1 mb-8">
          {SETUP_STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full ${index <= currentIndex ? "bg-gray-900" : "bg-gray-200"}`}
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
            className={`px-4 py-2 text-sm text-gray-600 ${currentIndex === 0 ? "invisible" : ""}`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSaveAndProceed}
            disabled={saving}
            className="px-6 py-2 bg-gray-900 text-white text-sm rounded disabled:opacity-30"
          >
            {saving ? "Saving…" : isLast ? "Save and Finish" : "Save and Proceed"}
          </button>
        </div>
      </div>
    </FormProvider>
  );
};

export default SetupFlow;
