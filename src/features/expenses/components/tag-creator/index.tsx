import { zodResolver } from "@hookform/resolvers/zod";
import type { SyntheticEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import ColorPicker from "@/shared/components/color-picker";
import Input from "@/shared/components/form-elements/input";

const tagSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid tag color"),
});

type TagValues = z.infer<typeof tagSchema>;

interface PropsType {
  existingNames: string[];
  onAdd: (name: string, color: string) => Promise<void>;
  onCancel: () => void;
}

const TagCreator = ({ existingNames, onAdd, onCancel }: PropsType) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [error, setError] = useState("");
  const methods = useForm<TagValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: "", color: "#6366f1" },
  });
  const { isSubmitting } = methods.formState;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (isSubmitting) event.preventDefault();
    else onCancel();
  };

  const handleSave = methods.handleSubmit(async (values) => {
    setError("");
    if (existingNames.some((name) => name.trim().toLowerCase() === values.name.toLowerCase())) {
      methods.setError("name", { message: "Tag already exists" });
      return;
    }
    try {
      await onAdd(values.name, values.color);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not add this tag");
    }
  });

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={handleCancel}
      className="m-auto max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 text-[var(--ink)] shadow-2xl backdrop:bg-black/60 sm:p-6"
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSave} className="flex min-w-0 flex-col gap-5">
          <h2 id={titleId} className="section-title">
            Create new tag
          </h2>
          <label className="block">
            <span className="field-label">Tag name</span>
            <Input name="name" placeholder="e.g. Weekend" autoFocus />
          </label>
          <ColorPicker name="color" label="Tag color" />
          {error && (
            <p role="alert" className="note money-negative">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? "Creating…" : "Create tag"}
            </button>
          </div>
        </form>
      </FormProvider>
    </dialog>
  );
};

export default TagCreator;
