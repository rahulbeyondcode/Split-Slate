import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import StepCategories from "@/features/create-group/components/step-categories";
import StepCurrency from "@/features/create-group/components/step-currency";
import StepGroup from "@/features/create-group/components/step-group";
import StepMembers from "@/features/create-group/components/step-members";

import { useStore } from "@/shared/configs/store";
import {
  CREATE_GROUP_STEP_FIELDS,
  CREATE_GROUP_STEPS,
  type CreateGroupFormValues,
  createGroupSchema,
} from "@/features/create-group/helpers/schema";

import { GROUP_EMOJIS } from "@/shared/constants/emojis";
import type { GroupDraft } from "@/shared/types/domain.types";

// Flattens the form shape into the memory-only draft the live preview subscribes to.
const toGroupDraft = (values: CreateGroupFormValues): GroupDraft => ({
  name: values.group.name,
  icon: values.group.icon,
  currency: values.currency,
  categories: values.categories.map((category) => ({ name: category.name, icon: category.icon })),
  members: values.members.map((member) => ({ name: member.name, icon: member.icon })),
});

const CreateGroupFlow = () => {
  const navigate = useNavigate();
  const {
    masterCategories,
    defaultGroupCategories,
    createGroup,
    addCategory,
    addMember,
    addPerson,
    setGroupDraft,
    clearGroupDraft,
  } = useStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const defaultCategories = defaultGroupCategories.map((name) => ({
    name,
    icon: masterCategories.find((master) => master.name === name)?.icon ?? "",
  }));

  const methods = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    mode: "onChange",
    defaultValues: {
      group: { name: "", icon: GROUP_EMOJIS[0] },
      currency: "INR",
      categories: defaultCategories,
      members: [],
    },
  });

  const { getValues, subscribe, trigger } = methods;

  // Mirror the form into the store draft: seed once, then push every value change (per-keystroke).
  useEffect(() => {
    setGroupDraft(toGroupDraft(getValues()));
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => setGroupDraft(toGroupDraft(values)),
    });
    return () => {
      unsubscribe();
      clearGroupDraft();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = CREATE_GROUP_STEPS[stepIndex];
  const isLast = stepIndex === CREATE_GROUP_STEPS.length - 1;

  const handleBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  const handleCreate = async () => {
    const values = getValues();
    setSaving(true);
    try {
      const { group } = await createGroup(values.group.name, values.group.icon, values.currency);
      for (const category of values.categories) {
        await addCategory(group.id, category.name, category.icon);
      }
      for (const member of values.members) {
        const personId = member.personId ?? (await addPerson(member.name, member.icon)).id;
        await addMember(group.id, personId);
      }
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const valid = await trigger(CREATE_GROUP_STEP_FIELDS[currentStep]);
    if (!valid) return;
    if (isLast) {
      await handleCreate();
    } else {
      setStepIndex((index) => index + 1);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col min-h-svh">
        <header className="flex items-center gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-6 py-4">
          <Link to="/dashboard" className="btn btn-secondary !px-3" aria-label="Back to dashboard">
            ←
          </Link>
          <h1 className="section-title">New group</h1>
          <span className="chip chip-selected">
            Step {stepIndex + 1} of {CREATE_GROUP_STEPS.length}
          </span>
        </header>
        <div className="mx-auto flex w-full max-w-2xl gap-1 px-6 pt-6">
          {CREATE_GROUP_STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full ${index <= stepIndex ? "bg-[var(--brand)]" : "bg-[var(--line)]"}`}
            />
          ))}
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
          {currentStep === "group" && (
            <StepGroup
              title="Name your group"
              subtitle="A trip, a flat, a lunch club — give it a face."
            />
          )}
          {currentStep === "currency" && <StepCurrency />}
          {currentStep === "categories" && <StepCategories />}
          {currentStep === "members" && <StepMembers />}
        </div>

        <div className="form-toolbar">
          <button
            type="button"
            onClick={handleBack}
            className={`btn btn-secondary ${stepIndex === 0 ? "invisible" : ""}`}
          >
            Back
          </button>
          <button type="button" onClick={handleNext} disabled={saving} className="btn btn-primary">
            {saving ? "Creating…" : isLast ? "Create group" : "Save and Proceed"}
          </button>
        </div>
      </div>
    </FormProvider>
  );
};

export default CreateGroupFlow;
