import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useOutletContext } from "react-router-dom";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";

import { CATEGORY_EMOJIS } from "@/shared/constants/emojis";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Category } from "@/shared/types/domain.types";

const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Category name is required"),
  icon: z.string().min(1),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type CategoryMode = "add" | "edit" | null;

const CategoryManagement = () => {
  const { group, groupCategories, groupExpenses } = useOutletContext<GroupDetailContext>();
  const { addCategory, updateCategory, removeCategory } = useStore();
  const [categoryMode, setCategoryMode] = useState<CategoryMode>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", icon: CATEGORY_EMOJIS[0] },
  });
  const { isSubmitting } = categoryForm.formState;
  const categoryFormTitle = categoryMode === "edit" ? "Edit category" : "Add category";
  const categorySubmitLabel = categoryMode === "edit" ? "Save" : "Add";

  const findDuplicateCategory = (name: string) =>
    groupCategories.some(
      (category) =>
        category.id !== editingCategoryId &&
        category.name.trim().toLowerCase() === name.toLowerCase(),
    );

  const handleAddCategoryClick = () => {
    setCategoryError(null);
    setCategoryMode("add");
    setEditingCategoryId(null);
    categoryForm.reset({ name: "", icon: CATEGORY_EMOJIS[0] });
  };

  const handleEditCategory = (category: Category) => {
    setCategoryError(null);
    setCategoryMode("edit");
    setEditingCategoryId(category.id);
    categoryForm.reset({ name: category.name, icon: category.icon });
  };

  const handleCancelCategoryForm = () => {
    setCategoryError(null);
    setCategoryMode(null);
    setEditingCategoryId(null);
    categoryForm.reset({ name: "", icon: CATEGORY_EMOJIS[0] });
  };

  const handleSaveCategory = categoryForm.handleSubmit(async (values) => {
    setCategoryError(null);
    if (findDuplicateCategory(values.name)) {
      categoryForm.setError("name", { message: "Category already exists" });
      return;
    }

    try {
      if (categoryMode === "edit" && editingCategoryId) {
        await updateCategory(editingCategoryId, { name: values.name, icon: values.icon });
      } else {
        await addCategory(group.id, values.name, values.icon);
      }
      handleCancelCategoryForm();
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Could not save this category");
    }
  });

  const handleDeleteCategory = async (category: Category) => {
    setCategoryError(null);
    const isInUse = groupExpenses.some((expense) => expense.categoryId === category.id);
    if (isInUse) {
      setCategoryError(
        `“${category.name}” is used by an expense. Reassign those expenses before deleting it.`,
      );
      return;
    }
    if (groupCategories.length <= 1) {
      setCategoryError("A group needs at least one category");
      return;
    }

    const confirmed = window.confirm(`Delete “${category.name}”? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await removeCategory(category.id);
      if (editingCategoryId === category.id) handleCancelCategoryForm();
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Could not delete this category");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Categories</h3>
          <p className="text-sm text-gray-500">{groupCategories.length} available</p>
        </div>
        {categoryMode !== "add" && (
          <button
            type="button"
            onClick={handleAddCategoryClick}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded shrink-0"
          >
            Add category
          </button>
        )}
      </div>

      {categoryError && <p className="text-sm text-red-500">{categoryError}</p>}

      {categoryMode && (
        <FormProvider {...categoryForm}>
          <form onSubmit={handleSaveCategory} className="flex flex-col gap-2 border rounded p-3">
            <p className="text-sm font-medium text-gray-900">{categoryFormTitle}</p>
            <div className="flex gap-2 items-start">
              <EmojiPicker name="icon" emojis={CATEGORY_EMOJIS} />
              <Input name="name" placeholder="Category name" wrapperClass="flex-1" autoFocus />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancelCategoryForm}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : categorySubmitLabel}
              </button>
            </div>
          </form>
        </FormProvider>
      )}

      <ul className="flex flex-col gap-2">
        {groupCategories.map((category) => (
          <li
            key={category.id}
            className="flex items-center justify-between gap-3 rounded border border-gray-200 px-4 py-3"
          >
            <span className="text-sm font-medium text-gray-900">
              {category.icon} {category.name}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleEditCategory(category)}
                className="text-xs font-medium text-gray-600"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(category)}
                className="text-xs font-medium text-red-500"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryManagement;
