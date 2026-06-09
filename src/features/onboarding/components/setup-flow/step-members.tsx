import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";
import type { SetupFormValues } from "@/features/onboarding/helpers/setup-schema";
import type { MemberEditorValues } from "@/features/onboarding/helpers/setupflow-types";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";

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
  const localUser = useStore((s) => s.localUser);
  const { control } = useFormContext<SetupFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "members", keyName: "_key" });
  const [addingNewMember, setAddingNewMember] = useState(false);

  const existingNames = [localUser?.name ?? "", ...fields.map((f) => f.name)];

  const methods = useForm<MemberEditorValues>({
    resolver: zodResolver(createMemberSchema(existingNames)),
    defaultValues: { name: "", icon: PERSON_EMOJIS[0] },
  });

  const { reset, handleSubmit } = methods;

  const handleOpenAdd = () => {
    reset({ name: "", icon: PERSON_EMOJIS[0] });
    setAddingNewMember(true);
  };

  const handleSaveMember = handleSubmit((v) => {
    append({ name: v.name.trim(), icon: v.icon });
    setAddingNewMember(false);
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Add members</h2>
        <p className="text-sm text-gray-500">
          You're already in this group. Add others now, or continue — you can always add them later.
        </p>
      </div>

      {addingNewMember ? (
        <FormProvider {...methods}>
          <form onSubmit={handleSaveMember} className="flex flex-col gap-2 border rounded p-3">
            <div className="flex gap-2 items-start">
              <EmojiPicker name="icon" emojis={PERSON_EMOJIS} />
              <Input name="name" placeholder="Member name" wrapperClass="flex-1" autoFocus />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setAddingNewMember(false)}
                className="px-4 py-2 text-sm text-gray-500"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded">
                Add
              </button>
            </div>
          </form>
        </FormProvider>
      ) : (
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-sm border border-dashed border-gray-400 rounded text-gray-600"
        >
          + Add new member
        </button>
      )}

      <ul className="flex flex-col gap-2">
        <li className="flex items-center justify-between px-3 py-2 border rounded bg-gray-50">
          <span className="text-sm">
            {localUser?.icon} {localUser?.name}
          </span>
          <span className="text-xs text-gray-400">You</span>
        </li>
        {fields.map((f, i) => (
          <li key={f._key} className="flex items-center justify-between px-3 py-2 border rounded">
            <span className="text-sm">
              {f.icon} {f.name}
            </span>
            <button type="button" onClick={() => remove(i)} className="text-xs text-red-500">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StepMembers;
