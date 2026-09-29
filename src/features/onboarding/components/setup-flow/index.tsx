import { zodResolver } from "@hookform/resolvers/zod";
import { Check, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import StepCategories from "@/features/create-group/components/step-categories";
import StepCurrency from "@/features/create-group/components/step-currency";
import StepGroup from "@/features/create-group/components/step-group";
import StepMembers from "@/features/create-group/components/step-members";
import StepIdentity from "@/features/onboarding/components/setup-flow/step-identity";

import { useFinishOnboarding } from "@/features/onboarding/hooks/use-finish-onboarding";
import { useStore } from "@/shared/configs/store";
import { prevStep, SETUP_STEPS } from "@/shared/utils/setup-steps";
import {
  type SetupFormValues,
  setupSchema,
  STEP_FIELDS,
} from "@/features/onboarding/helpers/setup-schema";

import { GROUP_EMOJIS } from "@/shared/constants/emojis";

import heartHandsAnimation from "@/assets/images/noto-heart-hands.webp";
import moneyAnimation from "@/assets/images/noto-money-with-wings.webp";
import shoppingCartAnimation from "@/assets/images/noto-shopping-cart.webp";
import sparklesAnimation from "@/assets/images/noto-sparkles.webp";
import waveAnimation from "@/assets/images/noto-wave.webp";
import Icon from "@/shared/ui/icon";

const STEP_PRESENTATION = {
  identity: {
    label: "Your identity",
    icon: "👋",
    animatedIcon: waveAnimation,
    title: "First, a face for the ledger.",
    description: "Your name and emoji appear next to everything you pay and owe.",
    formTitle: "What do people call you?",
    formDescription: "Just a name and a face — this stays on your device.",
  },
  group: {
    label: "First group",
    icon: "✨",
    animatedIcon: sparklesAnimation,
    title: "Make a space for your people.",
    description: "Give your first group a name. You can always create more later.",
    formTitle: "Create your first group",
    formDescription: "A group holds all expenses between a set of people.",
  },
  currency: {
    label: "Currency",
    icon: "💸",
    animatedIcon: moneyAnimation,
    title: "Keep every total clear.",
    description: "Choose the currency your group will use for its expenses.",
    formTitle: "One currency for this group",
    formDescription: "All expenses in this group will use this currency.",
  },
  categories: {
    label: "Categories",
    icon: "🛒",
    animatedIcon: shoppingCartAnimation,
    title: "Make sense of the spending.",
    description: "Pick the categories that fit your group. You can change them later.",
    formTitle: "What will you spend on?",
    formDescription:
      "Pick the categories that make sense for this group. You can always add more later.",
  },
  members: {
    label: "Members",
    icon: "🫶",
    animatedIcon: heartHandsAnimation,
    title: "Bring your people together.",
    description: "Add friends now, or start solo and invite them later.",
    formTitle: "Who's coming along?",
    formDescription: "Optional — adding members can wait.",
  },
};

const SetupFlow = () => {
  const {
    localUser,
    groups,
    people,
    members,
    categories,
    masterCategories,
    defaultGroupCategories,
    onboardingStep,
    onboardingLastCompletedStep,
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
    addPerson,
  } = useStore();
  const finishOnboarding = useFinishOnboarding();
  const [saving, setSaving] = useState(false);
  const [memberEditorOpen, setMemberEditorOpen] = useState(false);
  const [loadedAnimation, setLoadedAnimation] = useState<string | null>(null);

  useEffect(() => {
    Object.values(STEP_PRESENTATION).forEach(({ animatedIcon }) => {
      const image = new Image();
      image.src = animatedIcon;
    });
  }, []);

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
    .map((member) => {
      const person = people.find((p) => p.id === member.personId);
      return {
        id: member.id,
        personId: member.personId,
        name: person?.name ?? "",
        icon: person?.icon ?? "",
      };
    });

  const methods = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    mode: "onChange",
    defaultValues: {
      identity: { name: localUser?.name ?? "", icon: localUser?.icon ?? "🦊" },
      group: { name: group?.name ?? "", icon: group?.icon ?? GROUP_EMOJIS[0] },
      currency: group?.currency ?? "INR",
      categories: existingCategories.length ? existingCategories : defaultCategories,
      members: existingMembers,
    },
  });

  const currentIndex = SETUP_STEPS.indexOf(onboardingStep);
  const lastCompletedIndex =
    onboardingLastCompletedStep === null ? -1 : SETUP_STEPS.indexOf(onboardingLastCompletedStep);
  const isLast = onboardingStep === "members";
  const presentation = STEP_PRESENTATION[onboardingStep];

  const handleBack = () => {
    setMemberEditorOpen(false);
    setOnboardingStep(prevStep(onboardingStep));
  };

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
      if (member.id) continue;
      const personId = member.personId ?? (await addPerson(member.name, member.icon)).id;
      await addMember(group.id, personId);
    }
  };

  const handleSaveAndProceed = async () => {
    if (onboardingStep === "members" && memberEditorOpen) return;
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
      <main className="onboarding-layout">
        <aside className="onboarding-panel" aria-label="Setup progress">
          <div className="onboarding-brand">
            <span className="onboarding-brand-mark" aria-hidden="true" />
            <span>SplitSlate</span>
          </div>

          <div className="onboarding-story" key={onboardingStep}>
            <span
              className={`onboarding-story-icon ${loadedAnimation === presentation.animatedIcon ? "is-animated" : ""}`}
              aria-hidden="true"
            >
              <span className="onboarding-story-icon-static">{presentation.icon}</span>
              <img
                className="onboarding-story-icon-animation"
                src={presentation.animatedIcon}
                alt=""
                onLoad={() => setLoadedAnimation(presentation.animatedIcon)}
              />
            </span>
            <h2>{presentation.title}</h2>
            <p>{presentation.description}</p>
          </div>

          <div className="onboarding-panel-footer">
            <ol className="onboarding-progress" aria-label="Setup steps">
              {SETUP_STEPS.map((step, index) => {
                const isComplete = index <= lastCompletedIndex;
                return (
                  <li
                    key={step}
                    className={`${index === currentIndex ? "is-current" : ""} ${isComplete ? "is-complete" : ""}`}
                    aria-current={index === currentIndex ? "step" : undefined}
                  >
                    <span className="onboarding-progress-number" aria-hidden="true">
                      {isComplete ? <Icon icon={Check} size={16} /> : index + 1}
                    </span>
                    {isComplete && <span className="sr-only">Completed: </span>}
                    <span>{STEP_PRESENTATION[step].label}</span>
                  </li>
                );
              })}
            </ol>
            <p className="onboarding-privacy inline-flex items-center gap-2">
              <Icon icon={LockKeyhole} size={16} /> No accounts · no cloud · works offline
            </p>
          </div>
        </aside>

        <section className="onboarding-main" aria-label={`${presentation.label} setup`}>
          <div className="onboarding-content">
            <header className="onboarding-header">
              <p className="eyebrow onboarding-step-count">
                Step {currentIndex + 1} of {SETUP_STEPS.length}
              </p>
              <h1>{presentation.formTitle}</h1>
              <p className="onboarding-form-description">{presentation.formDescription}</p>
            </header>
            <div
              className={`onboarding-step-content ${onboardingStep === "currency" ? "onboarding-step-content--currency" : ""} ${onboardingStep === "members" ? "onboarding-step-content--members" : ""}`}
              key={onboardingStep}
            >
              {onboardingStep === "identity" && <StepIdentity />}
              {onboardingStep === "group" && <StepGroup showHeading={false} />}
              {onboardingStep === "currency" && <StepCurrency showHeading={false} />}
              {onboardingStep === "categories" && <StepCategories showHeading={false} />}
              {onboardingStep === "members" && (
                <StepMembers showHeading={false} onEditorOpenChange={setMemberEditorOpen} />
              )}
            </div>

            <div className="onboarding-actions">
              {currentIndex > 0 && (
                <button type="button" onClick={handleBack} className="btn btn-secondary">
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveAndProceed}
                disabled={saving || (isLast && memberEditorOpen)}
                className="btn btn-primary onboarding-continue"
              >
                {saving ? "Saving…" : isLast ? "Save and Finish" : "Save and Proceed"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </FormProvider>
  );
};

export default SetupFlow;
