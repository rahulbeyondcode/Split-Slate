import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

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

const CreateGroupFlow = () => {
  const navigate = useNavigate();
  const { masterCategories, defaultGroupCategories, createGroup, addCategory, addMember } =
    useStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const defaultCategories = defaultGroupCategories.map((name) => ({
    name,
    icon: masterCategories.find((master) => master.name === name)?.icon ?? "",
  }));

  const methods = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      group: { name: "", icon: GROUP_EMOJIS[0] },
      currency: "INR",
      categories: defaultCategories,
      members: [],
    },
  });

  const currentStep = CREATE_GROUP_STEPS[stepIndex];
  const isLast = stepIndex === CREATE_GROUP_STEPS.length - 1;

  const handleBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  const handleCreate = async () => {
    const values = methods.getValues();
    setSaving(true);
    try {
      const { group } = await createGroup(values.group.name, values.group.icon, values.currency);
      for (const category of values.categories) {
        await addCategory(group.id, category.name, category.icon);
      }
      for (const member of values.members) {
        await addMember(group.id, member.name, member.icon);
      }
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const valid = await methods.trigger(CREATE_GROUP_STEP_FIELDS[currentStep]);
    if (!valid) return;
    if (isLast) {
      await handleCreate();
    } else {
      setStepIndex((index) => index + 1);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-svh p-6 max-w-md mx-auto">
        <div className="flex gap-1 mb-8">
          {CREATE_GROUP_STEPS.map((step, index) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full ${index <= stepIndex ? "bg-gray-900" : "bg-gray-200"}`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {currentStep === "group" && (
            <StepGroup
              title="Create a group"
              subtitle="A group holds all expenses between a set of people."
            />
          )}
          {currentStep === "currency" && <StepCurrency />}
          {currentStep === "categories" && <StepCategories />}
          {currentStep === "members" && <StepMembers />}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={handleBack}
            className={`px-4 py-2 text-sm text-gray-600 ${stepIndex === 0 ? "invisible" : ""}`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="px-6 py-2 bg-gray-900 text-white text-sm rounded disabled:opacity-30"
          >
            {saving ? "Creating…" : isLast ? "Create group" : "Next"}
          </button>
        </div>
      </div>
    </FormProvider>
  );
};

export default CreateGroupFlow;
