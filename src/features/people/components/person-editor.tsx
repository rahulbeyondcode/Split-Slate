import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { createPersonSchema, type PersonEditorValues } from "@/features/people/helpers/schema";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";

interface PropsType {
  existingNames: string[];
  onSave: (values: PersonEditorValues) => void | Promise<void>;
  onCancel: () => void;
  initial?: PersonEditorValues;
  submitLabel?: string;
}

const PersonEditor = ({
  existingNames,
  onSave,
  onCancel,
  initial,
  submitLabel = "Save",
}: PropsType) => {
  const methods = useForm<PersonEditorValues>({
    resolver: zodResolver(createPersonSchema(existingNames)),
    defaultValues: initial ?? { name: "", icon: PERSON_EMOJIS[0] },
  });

  const handleSave = methods.handleSubmit(async (values) => {
    await onSave({ name: values.name.trim(), icon: values.icon });
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSave} className="surface surface-pad flex flex-col gap-4">
        <div className="flex gap-2 items-start">
          <EmojiPicker name="icon" emojis={PERSON_EMOJIS} />
          <label className="flex-1">
            <span className="field-label">Name</span>
            <Input name="name" placeholder="Name" autoFocus />
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={methods.formState.isSubmitting}
            className="btn btn-primary"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default PersonEditor;
