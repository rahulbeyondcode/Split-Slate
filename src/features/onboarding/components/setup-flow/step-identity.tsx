import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import PortalComponent from "@/shared/components/portal";

import { useStore } from "@/shared/configs/store";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";

type FormValues = z.infer<typeof schema>;

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string(),
});

const StepIdentity = () => {
  const { localUser, setLocalUser, advanceOnboarding } = useStore();

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: localUser?.name ?? "", icon: localUser?.icon ?? PERSON_EMOJIS[0] },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const submit = handleSubmit(async (v) => {
    await setLocalUser(v.name, v.icon);
    await advanceOnboarding("identity");
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold mb-1">What should we call you?</h2>
          <p className="text-sm text-gray-500">This name appears when you add expenses.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Your name</label>
          <input
            {...register("name")}
            placeholder="Enter your name"
            className="border rounded px-3 py-2 text-sm outline-none focus:border-gray-900"
            autoFocus
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Pick an icon</label>
          <EmojiPicker name="icon" emojis={PERSON_EMOJIS} />
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

export default StepIdentity;
