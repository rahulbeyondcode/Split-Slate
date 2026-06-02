import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";
import PortalComponent from "@/shared/components/portal";

import { useFinishOnboarding } from "@/features/onboarding/hooks/use-finish-onboarding";
import { useStore } from "@/shared/configs/store";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";

type FormValues = { name: string; icon: string };

const createMemberSchema = (existingNames: string[]) =>
  z.object({
    name: z
      .string()
      .min(1, "Member name is required")
      .refine(
        (val) => !existingNames.some((n) => n.toLowerCase() === val.trim().toLowerCase()),
        "A member with this name already exists",
      ),
    icon: z.string(),
  });

const StepMembers = () => {
  const { localUser, groups, members, onboardingGroupId, addMember, removeMember } = useStore();
  const finishOnboarding = useFinishOnboarding();
  const [saving, setSaving] = useState(false);

  const group = groups.find((g) => g.id === onboardingGroupId);
  const creatorId = group?.frequentPayerIds[0];
  const addedMembers = members.filter((m) => m.groupId === onboardingGroupId && m.id !== creatorId);

  const existingNames = [localUser?.name ?? "", ...addedMembers.map((m) => m.name)];

  const methods = useForm<FormValues>({
    resolver: zodResolver(createMemberSchema(existingNames)),
    defaultValues: { name: "", icon: PERSON_EMOJIS[0] },
  });

  const handleAdd = methods.handleSubmit((values) => {
    if (group) addMember(group.id, values.name.trim(), values.icon);
    methods.reset({ name: "", icon: PERSON_EMOJIS[0] });
  });

  const handleFinish = async () => {
    setSaving(true);
    try {
      await finishOnboarding();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Add members</h2>
        <p className="text-sm text-gray-500">
          You're already in this group. Add others now, or skip — you can always add them later.
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <div className="flex gap-2 items-start">
            <EmojiPicker name="icon" emojis={PERSON_EMOJIS} />
            <Input name="name" placeholder="Member name" wrapperClass="flex-1" />
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded">
              Add
            </button>
          </div>
        </form>
      </FormProvider>

      <ul className="flex flex-col gap-2">
        <li className="flex items-center justify-between px-3 py-2 border rounded bg-gray-50">
          <span className="text-sm">
            {localUser?.icon} {localUser?.name}
          </span>
          <span className="text-xs text-gray-400">You</span>
        </li>
        {addedMembers.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-3 py-2 border rounded">
            <span className="text-sm">
              {m.icon} {m.name}
            </span>
            <button
              type="button"
              onClick={() => removeMember(m.id)}
              className="text-xs text-red-500"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <PortalComponent id="next-btn-slot">
        <button
          type="button"
          onClick={handleFinish}
          disabled={saving}
          className="px-6 py-2 bg-gray-900 text-white text-sm rounded disabled:opacity-30"
        >
          {saving ? "Saving…" : "Done"}
        </button>
      </PortalComponent>
    </div>
  );
};

export default StepMembers;
