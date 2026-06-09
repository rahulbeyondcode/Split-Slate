import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import type { CategoryEditorValues } from "@/features/onboarding/helpers/setupflow-types";

import { CATEGORY_EMOJIS } from "@/shared/constants/emojis";

const createCategorySchema = (existingNames: string[]) =>
  z.object({
    category: z
      .string()
      .min(1, "Category name is required")
      .refine(
        (val) => !existingNames.some((name) => name.toLowerCase() === val.trim().toLowerCase()),
        "Category already exists",
      ),
    icon: z.string(),
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border rounded p-3">
        <div className="flex gap-2 items-start">
          <EmojiPicker name="icon" emojis={CATEGORY_EMOJIS} />
          <Input name="category" placeholder="Category name" wrapperClass="flex-1" autoFocus />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded">
            Add
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default CategoryEditor;
