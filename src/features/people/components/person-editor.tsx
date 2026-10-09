import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { createPersonSchema, type PersonEditorValues } from "@/features/people/helpers/schema";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";

import DialogLayout from "@/shared/ui/dialog-layout";

interface PropsType {
  existingNames: string[];
  onSave: (values: PersonEditorValues) => void | Promise<void>;
  onCancel: () => void;
  initial?: PersonEditorValues;
  submitLabel?: string;
  inDialog?: boolean;
  beforeFields?: ReactNode;
  error?: string | null;
  busy?: boolean;
}

const PersonEditor = ({
  existingNames,
  onSave,
  onCancel,
  initial,
  submitLabel = "Save",
  inDialog = false,
  beforeFields,
  error,
  busy = false,
}: PropsType) => {
  const methods = useForm<PersonEditorValues>({
    resolver: zodResolver(createPersonSchema(existingNames)),
    mode: "onChange",
    defaultValues: initial ?? { name: "", icon: PERSON_EMOJIS[0] },
  });

  const handleSave = methods.handleSubmit(async (values) => {
    await onSave({ name: values.name.trim(), icon: values.icon });
  });

  const pending = busy || methods.formState.isSubmitting;
  const fields = (
    <>
      {beforeFields}
      {error && (
        <p role="alert" className="note money-negative">
          {error}
        </p>
      )}
      <div className="min-w-0">
        <label className="field-label" htmlFor="person-name">
          Name
        </label>
        <Input
          id="person-name"
          name="name"
          placeholder="e.g. Karan"
          wrapperClass="w-full"
          autoFocus
        />
      </div>
      <div className="min-w-0">
        <span className="field-label">Choose an icon</span>
        <EmojiPicker name="icon" kind="profile" emojis={PERSON_EMOJIS} />
      </div>
    </>
  );
  const actions = (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={inDialog ? pending : undefined}
        className="btn btn-secondary"
      >
        Cancel
      </button>
      <button type="submit" disabled={pending} className="btn btn-primary">
        {submitLabel}
      </button>
    </>
  );

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSave}
        className={inDialog ? "dialog-form" : "flex min-w-0 flex-col gap-5 surface p-4 sm:p-5"}
      >
        {inDialog ? (
          <DialogLayout
            title={initial ? "Edit person" : "Add a person"}
            onClose={onCancel}
            closeDisabled={pending}
            bodyClassName="person-editor-dialog-body"
            footer={actions}
          >
            <fieldset disabled={pending} className="flex min-w-0 flex-col gap-5">
              {fields}
            </fieldset>
          </DialogLayout>
        ) : (
          <>
            <h3 className="section-title">{initial ? "Edit person" : "Add a person"}</h3>
            <div className="flex min-w-0 flex-col gap-5">{fields}</div>
            <div className="person-editor-actions flex flex-wrap gap-2 justify-end">{actions}</div>
          </>
        )}
      </form>
    </FormProvider>
  );
};

export default PersonEditor;
