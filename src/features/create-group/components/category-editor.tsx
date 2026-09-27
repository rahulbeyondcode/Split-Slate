import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { createRequiredStringSchema } from "@/shared/utils/string-validation";
import type { CategoryEditorValues } from "@/features/create-group/helpers/editor-types";

import { CATEGORY_EMOJIS } from "@/shared/constants/emojis";

const createCategorySchema = (existingNames: string[]) =>
  z.object({
    category: createRequiredStringSchema("Category name is required").refine(
      (val) => !existingNames.some((name) => name.toLowerCase() === val.trim().toLowerCase()),
      "Category already exists",
    ),
    icon: createRequiredStringSchema("Category icon is required"),
  });

interface PropsType {
  existingNames: string[];
  onAdd: (name: string, icon: string) => void;
  onCancel: () => void;
}

const CategoryEditor = ({ existingNames, onAdd, onCancel }: PropsType) => {
  const editorForm = useForm<CategoryEditorValues>({
    resolver: zodResolver(createCategorySchema(existingNames)),
    defaultValues: { category: "", icon: CATEGORY_EMOJIS[0] },
  });

  const handleSubmit = editorForm.handleSubmit(({ category, icon }) => {
    onAdd(category.trim(), icon);
  });

  return (
    <FormProvider {...editorForm}>
      <form onSubmit={handleSubmit} className="surface flex min-w-0 flex-col gap-5 p-4 sm:p-5">
        <h3 className="section-title">Add a category</h3>

        <div className="min-w-0">
          <label className="field-label" htmlFor="category-name">
            Category name
          </label>
          <Input
            id="category-name"
            name="category"
            placeholder="e.g. Coffee runs"
            wrapperClass="w-full"
            autoFocus
          />
        </div>

        <div className="min-w-0">
          <span className="field-label">Choose an icon</span>
          <EmojiPicker name="icon" emojis={CATEGORY_EMOJIS} />
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Add category
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default CategoryEditor;
