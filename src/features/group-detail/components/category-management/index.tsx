import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useOutletContext } from "react-router-dom";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";
import { createRequiredStringSchema } from "@/shared/utils/string-validation";

import { CATEGORY_EMOJIS } from "@/shared/constants/emojis";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Category } from "@/shared/types/domain.types";

import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import Icon from "@/shared/ui/icon";

const categoryFormSchema = z.object({
  name: createRequiredStringSchema("Category name is required"),
  icon: createRequiredStringSchema("Category icon is required"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type CategoryMode = "add" | "edit" | null;

const CategoryManagement = () => {
  const { group, groupCategories, groupExpenses } = useOutletContext<GroupDetailContext>();
  const { addCategory, updateCategory, removeCategory } = useStore();
  const [categoryMode, setCategoryMode] = useState<CategoryMode>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [confirmCategoryId, setConfirmCategoryId] = useState<string | null>(null);
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

  const handleDeleteCategory = (category: Category) => {
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

    setConfirmCategoryId(category.id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmCategoryId) return;
    await removeCategory(confirmCategoryId);
    if (editingCategoryId === confirmCategoryId) handleCancelCategoryForm();
    setConfirmCategoryId(null);
  };
  const confirmCategory = groupCategories.find((category) => category.id === confirmCategoryId);

  return (
    <div className="surface surface-pad flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Categories</h2>
          <p className="soft-caption">{groupCategories.length} available</p>
        </div>
        {categoryMode !== "add" && (
          <button type="button" onClick={handleAddCategoryClick} className="btn btn-secondary">
            <Icon icon={Plus} size={18} /> Add category
          </button>
        )}
      </div>

      {categoryError && (
        <p role="alert" className="note money-negative">
          {categoryError}
        </p>
      )}

      {categoryMode && (
        <FormProvider {...categoryForm}>
          <form onSubmit={handleSaveCategory} className="flex flex-col gap-2 note">
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
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? "Saving..." : categorySubmitLabel}
              </button>
            </div>
          </form>
        </FormProvider>
      )}

      <ul>
        {groupCategories.map((category) => (
          <li key={category.id} className="ui-row flex-wrap">
            <span className="flex min-w-0 flex-1 basis-40 items-center gap-3 font-bold">
              <span className="avatar avatar-square !h-9 !w-9 !text-lg">{category.icon}</span>
              <span className="min-w-0 truncate">{category.name}</span>
              <span className="soft-caption shrink-0">
                {groupExpenses.filter((expense) => expense.categoryId === category.id).length}{" "}
                expenses
              </span>
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => handleEditCategory(category)}
                className="btn btn-secondary !px-3"
              >
                <Icon icon={Pencil} size={17} /> Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(category)}
                className="btn btn-danger !px-3"
              >
                <Icon icon={Trash2} size={17} /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmationDialog
        open={Boolean(confirmCategory)}
        title={`Delete ${confirmCategory?.name ?? "category"}?`}
        description="This category will be permanently deleted. This cannot be undone."
        confirmLabel="Delete category"
        onCancel={() => setConfirmCategoryId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CategoryManagement;
