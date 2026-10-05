import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Link, useOutletContext } from "react-router-dom";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";
import { useViewport } from "@/shared/hooks/use-viewport";
import type { EntitySuggestion } from "@/shared/utils/entity-suggestions";
import { createRequiredStringSchema } from "@/shared/utils/string-validation";

import { CATEGORY_EMOJIS } from "@/shared/constants/emojis";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Category } from "@/shared/types/domain.types";

import Avatar from "@/shared/ui/avatar";
import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import EntitySuggestions from "@/shared/ui/entity-suggestions";
import Icon from "@/shared/ui/icon";
import MobileEditorDialog from "@/shared/ui/mobile-editor-dialog";

const categoryFormSchema = z.object({
  name: createRequiredStringSchema("Category name is required"),
  icon: createRequiredStringSchema("Category icon is required"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type CategoryMode = "add" | "edit" | null;

const CategoryManagement = () => {
  const { isMobile } = useViewport();
  const { group, groupCategories, groupExpenses } = useOutletContext<GroupDetailContext>();
  const { addCategory, updateCategory, removeCategory } = useStore();
  const [categoryMode, setCategoryMode] = useState<CategoryMode>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [blockedCategoryId, setBlockedCategoryId] = useState<string | null>(null);
  const [confirmCategoryId, setConfirmCategoryId] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const blockedDialogRef = useRef<HTMLDialogElement>(null);
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", icon: CATEGORY_EMOJIS[0] },
  });
  const categoryQuery = useWatch({ control: categoryForm.control, name: "name" });
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

  const handleSuggestedCategory = async (suggestion: EntitySuggestion) => {
    if (!suggestion.icon || suggesting) return;
    setSuggesting(true);
    setCategoryError(null);
    try {
      await addCategory(group.id, suggestion.name, suggestion.icon);
      handleCancelCategoryForm();
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Could not add this category");
    } finally {
      setSuggesting(false);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryError(null);
    if (
      groupExpenses.some((expense) => expense.categoryId === category.id) ||
      groupCategories.length <= 1
    ) {
      setBlockedCategoryId(category.id);
      blockedDialogRef.current?.showModal();
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
  const blockedCategory = groupCategories.find((category) => category.id === blockedCategoryId);
  const blockedExpenseCount = groupExpenses.filter(
    (expense) => expense.categoryId === blockedCategoryId,
  ).length;
  const confirmCategory = groupCategories.find((category) => category.id === confirmCategoryId);
  const editor = categoryMode && (
    <FormProvider {...categoryForm}>
      <form
        onSubmit={handleSaveCategory}
        className={
          isMobile
            ? "flex min-w-0 flex-col gap-5"
            : "flex min-w-0 flex-col gap-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 sm:p-5"
        }
      >
        <h3 className="section-title">{categoryFormTitle}</h3>
        <div className="min-w-0">
          <label className="field-label" htmlFor="group-category-name">
            Category name
          </label>
          <Input
            id="group-category-name"
            name="name"
            placeholder="e.g. Coffee runs"
            wrapperClass="w-full"
            autoFocus
          />
          {categoryMode === "add" && (
            <EntitySuggestions
              kind="category"
              query={categoryQuery}
              currentGroupId={group.id}
              unavailableNames={groupCategories.map((item) => item.name)}
              disabled={isSubmitting || suggesting}
              onSelect={handleSuggestedCategory}
            />
          )}
        </div>
        <div className="min-w-0">
          <span className="field-label">Choose an icon</span>
          <EmojiPicker name="icon" kind="other" emojis={CATEGORY_EMOJIS} />
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            onClick={handleCancelCategoryForm}
            disabled={isSubmitting || suggesting}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || suggesting} className="btn btn-primary">
            {isSubmitting ? "Saving..." : categorySubmitLabel}
          </button>
        </div>
      </form>
    </FormProvider>
  );

  return (
    <div className="surface surface-pad flex flex-col gap-3">
      <div className="management-card-header flex items-center justify-between gap-4">
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

      <div className="management-card-content">
        {categoryError && !isMobile && (
          <p role="alert" className="note money-negative">
            {categoryError}
          </p>
        )}

        {categoryMode &&
          (isMobile ? (
            <MobileEditorDialog
              title={categoryFormTitle}
              onCancel={handleCancelCategoryForm}
              busy={isSubmitting || suggesting}
            >
              {categoryError && (
                <p role="alert" className="note money-negative mb-4">
                  {categoryError}
                </p>
              )}
              {editor}
            </MobileEditorDialog>
          ) : (
            editor
          ))}

        <ul>
          {groupCategories.map((category) => {
            const isBlocked =
              groupCategories.length <= 1 ||
              groupExpenses.some((expense) => expense.categoryId === category.id);
            return (
              <li key={category.id} className="ui-row management-entry category-entry flex-wrap">
                <span className="management-entry-identity flex min-w-0 flex-1 basis-40 items-center gap-3 font-bold">
                  <Avatar icon={category.icon} square className="!h-9 !w-9" />
                  <span className="min-w-0 truncate">{category.name}</span>
                  <span className="soft-caption shrink-0">
                    {groupExpenses.filter((expense) => expense.categoryId === category.id).length}{" "}
                    expenses
                  </span>
                </span>
                <div className="management-entry-actions ml-auto flex shrink-0 items-center gap-3">
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
                    aria-describedby={isBlocked ? `blocked-category-${category.id}` : undefined}
                    className={`btn !px-3 ${isBlocked ? "btn-blocked" : "btn-danger"}`}
                  >
                    <Icon icon={Trash2} size={17} /> Delete
                  </button>
                  {isBlocked && (
                    <span id={`blocked-category-${category.id}`} className="sr-only">
                      Cannot delete this category yet. Select to learn why.
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <dialog
        ref={blockedDialogRef}
        aria-labelledby="blocked-category-title"
        aria-describedby="blocked-category-description"
        onClose={() => setBlockedCategoryId(null)}
        className="m-auto w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      >
        <h2 id="blocked-category-title" className="section-title">
          Cannot delete {blockedCategory?.name ?? "this category"}
        </h2>
        <p id="blocked-category-description" className="mt-3 text-sm leading-relaxed">
          {blockedExpenseCount > 0
            ? `${blockedCategory?.name ?? "This category"} is used by ${blockedExpenseCount} ${blockedExpenseCount === 1 ? "expense" : "expenses"}. ${groupCategories.length <= 1 ? "Add another category and reassign those expenses" : "Reassign those expenses"} before deleting it.`
            : "A group needs at least one category. Add another category before deleting this one."}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => blockedDialogRef.current?.close()}
            className="btn btn-secondary"
          >
            Close
          </button>
          {blockedCategory && blockedExpenseCount > 0 && (
            <Link
              to={`/groups/${group.id}/expenses?${new URLSearchParams({ categoryIds: blockedCategory.id })}`}
              className="btn btn-primary"
            >
              View expenses
            </Link>
          )}
        </div>
      </dialog>
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
