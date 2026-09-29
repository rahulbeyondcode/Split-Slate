import { zodResolver } from "@hookform/resolvers/zod";
import type { SyntheticEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { createRequiredStringSchema } from "@/shared/utils/string-validation";

import { CATEGORY_EMOJIS } from "@/shared/constants/emojis";

const categorySchema = z.object({
  name: createRequiredStringSchema("Category name is required"),
  icon: createRequiredStringSchema("Category icon is required"),
});

type CategoryValues = z.infer<typeof categorySchema>;

interface PropsType {
  existingNames: string[];
  onAdd: (name: string, icon: string) => Promise<void>;
  onCancel: () => void;
}

const CategoryCreator = ({ existingNames, onAdd, onCancel }: PropsType) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", icon: CATEGORY_EMOJIS[0] },
  });
  const { isSubmitting } = methods.formState;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }
    onCancel();
  };

  const handleSave = methods.handleSubmit(async (values) => {
    setError(null);
    if (existingNames.some((name) => name.trim().toLowerCase() === values.name.toLowerCase())) {
      methods.setError("name", { message: "Category already exists" });
      return;
    }
    try {
      await onAdd(values.name, values.icon);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not add this category");
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
            Add category
          </h2>
          <div className="min-w-0">
            <label className="field-label" htmlFor="expense-category-name">
              Category name
            </label>
            <Input
              id="expense-category-name"
              name="name"
              placeholder="e.g. Coffee runs"
              wrapperClass="w-full"
              autoFocus
            />
          </div>
          <div className="min-w-0">
            <span className="field-label">Choose an icon</span>
            <EmojiPicker name="icon" kind="other" emojis={CATEGORY_EMOJIS} />
          </div>
          {error && (
            <p role="alert" className="note money-negative">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? "Adding…" : "Add category"}
            </button>
          </div>
        </form>
      </FormProvider>
    </dialog>
  );
};

export default CategoryCreator;
