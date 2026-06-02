import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import PortalComponent from "@/shared/components/portal";

import { useStore } from "@/shared/configs/store";

import { GROUP_EMOJIS } from "@/shared/constants/emojis";

type FormValues = z.infer<typeof schema>;

const schema = z.object({
  name: z.string().min(1, "Group name is required"),
  icon: z.string(),
});

const StepGroup = () => {
  const {
    groups,
    onboardingGroupId,
    createGroup,
    updateGroup,
    updateOnboarding,
    advanceOnboarding,
  } = useStore();
  const group = groups.find((g) => g.id === onboardingGroupId);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: group?.name ?? "", icon: group?.icon ?? GROUP_EMOJIS[0] },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const submit = handleSubmit(async (v) => {
    if (group) {
      await updateGroup(group.id, { name: v.name, icon: v.icon });
    } else {
      const { group: created } = await createGroup(v.name, v.icon, "INR");
      await updateOnboarding({ groupId: created.id });
    }
    await advanceOnboarding("group");
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Create your first group</h2>
          <p className="text-sm text-gray-500">
            A group holds all expenses between a set of people.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Group name</label>
          <input
            {...register("name")}
            placeholder="e.g. Goa Trip, Flatmates, Family"
            className="border rounded px-3 py-2 text-sm outline-none focus:border-gray-900"
            autoFocus
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Pick an icon</label>
          <EmojiPicker name="icon" emojis={GROUP_EMOJIS} />
        </div>

        <PortalComponent id="next-btn-slot">
          <button
            type="button"
            onClick={submit}
            className="px-6 py-2 bg-gray-900 text-white text-sm rounded"
          >
            Next
          </button>
        </PortalComponent>
      </form>
    </FormProvider>
  );
};

export default StepGroup;
