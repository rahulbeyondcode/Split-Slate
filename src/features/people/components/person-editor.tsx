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
      <form onSubmit={handleSave} className="flex flex-col gap-2 border rounded p-3">
        <div className="flex gap-2 items-start">
          <EmojiPicker name="icon" emojis={PERSON_EMOJIS} />
          <Input name="name" placeholder="Name" wrapperClass="flex-1" autoFocus />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded">
            {submitLabel}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default PersonEditor;
