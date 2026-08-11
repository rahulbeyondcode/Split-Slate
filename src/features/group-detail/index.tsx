import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { z } from "zod";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";

import { CATEGORY_EMOJIS } from "@/shared/constants/emojis";
import type { Category } from "@/shared/types/domain.types";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  icon: z.string().min(1),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type CategoryMode = "add" | "edit" | null;

const getSection = (pathname: string) => {
  if (pathname.endsWith("/expenses")) return "expenses";
  if (pathname.endsWith("/members")) return "members";
  if (pathname.endsWith("/categories")) return "categories";
  if (pathname.endsWith("/settings")) return "settings";
  return "overview";
};

const formatMoney = (currency: string, amount: number) =>
  `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const GroupDetail = () => {
  const { groupId } = useParams();
  const { pathname } = useLocation();
  const {
    groups,
    members,
    people,
    categories,
    expenses,
    addCategory,
    updateCategory,
    removeCategory,
    removeTagFromGroupExpenses,
  } = useStore();
  const [categoryMode, setCategoryMode] = useState<CategoryMode>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", icon: CATEGORY_EMOJIS[0] },
  });

  if (!groupId) return <Navigate to="/dashboard" replace />;

  const group = groups.find((item) => item.id === groupId);
  if (!group) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-3 rounded border border-gray-200 p-5">
          <h1 className="text-xl font-semibold text-gray-900">Group not found</h1>
          <p className="text-sm text-gray-500">This group is not available on this device.</p>
          <Link to="/dashboard" className="text-sm font-medium text-blue-600">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const section = getSection(pathname);
  const groupMembers = members
    .filter((member) => member.groupId === group.id)
    .map((member) => ({
      ...member,
      person: people.find((person) => person.id === member.personId),
    }));
  const groupCategories = categories.filter((category) => category.groupId === group.id);
  const groupExpenses = expenses.filter((expense) => expense.groupId === group.id);
  const groupTags = Array.from(
    new Set(groupExpenses.flatMap((expense) => expense.tags ?? []).map((tag) => tag.trim())),
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const totalSpend = groupExpenses.reduce(
    (sum, expense) =>
      sum + expense.transactions.paid.reduce((paidSum, item) => paidSum + item.amount, 0),
    0,
  );
  const categoryFormTitle = categoryMode === "edit" ? "Edit category" : "Add category";
  const categorySubmitLabel = categoryMode === "edit" ? "Save" : "Add";

  const findDuplicateCategory = (name: string) =>
    groupCategories.some(
      (category) =>
        category.id !== editingCategoryId &&
        category.name.trim().toLowerCase() === name.trim().toLowerCase(),
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
    const name = values.name.trim();
    if (findDuplicateCategory(name)) {
      categoryForm.setError("name", { message: "Category already exists" });
      return;
    }

    if (categoryMode === "edit" && editingCategoryId) {
      await updateCategory(editingCategoryId, { name, icon: values.icon });
    } else {
      await addCategory(group.id, name, values.icon);
    }
    handleCancelCategoryForm();
  });

  const handleDeleteCategory = async (categoryId: string) => {
    setCategoryError(null);
    try {
      await removeCategory(categoryId);
      if (editingCategoryId === categoryId) handleCancelCategoryForm();
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Could not delete this category");
    }
  };

  const handleDeleteTag = async (tag: string) => {
    setTagError(null);
    try {
      await removeTagFromGroupExpenses(group.id, tag);
    } catch (err) {
      setTagError(err instanceof Error ? err.message : "Could not delete this tag");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-24 flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-4xl leading-none mb-3">{group.icon}</p>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-500">{group.currency} group</p>
        </div>
        <Link
          to={`/groups/${group.id}/expenses`}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded self-start"
        >
          Add expense
        </Link>
      </header>

      {section === "overview" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-gray-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Members</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{groupMembers.length}</p>
          </div>
          <div className="rounded border border-gray-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Expenses</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{groupExpenses.length}</p>
          </div>
          <div className="rounded border border-gray-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total paid</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {formatMoney(group.currency, totalSpend)}
            </p>
          </div>
        </div>
      )}

      {section === "expenses" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
          {groupExpenses.length === 0 ? (
            <p className="text-sm text-gray-500">No expenses have been added yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {groupExpenses.map((expense) => (
                <li key={expense.expenseId} className="rounded border border-gray-200 px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{expense.expenseName}</p>
                  <p className="text-xs text-gray-500">
                    {formatMoney(
                      group.currency,
                      expense.transactions.paid.reduce((sum, item) => sum + item.amount, 0),
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {section === "members" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          <ul className="flex flex-col gap-2">
            {groupMembers.map((member) => (
              <li key={member.id} className="flex items-center gap-3 rounded border px-4 py-3">
                <span className="text-xl">{member.person?.icon}</span>
                <span className="text-sm font-medium text-gray-900">
                  {member.person?.name ?? "Unknown person"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {section === "categories" && (
        <section className="flex flex-col gap-8">
          <h2 className="text-lg font-semibold text-gray-900">Categories & Tags</h2>

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
                <form
                  onSubmit={handleSaveCategory}
                  className="flex flex-col gap-2 border rounded p-3"
                >
                  <p className="text-sm font-medium text-gray-900">{categoryFormTitle}</p>
                  <div className="flex gap-2 items-start">
                    <EmojiPicker name="icon" emojis={CATEGORY_EMOJIS} />
                    <Input
                      name="name"
                      placeholder="Category name"
                      wrapperClass="flex-1"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleCancelCategoryForm}
                      className="px-4 py-2 text-sm text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-900 text-white text-sm rounded"
                    >
                      {categorySubmitLabel}
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
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-xs font-medium text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Tags</h3>
              <p className="text-sm text-gray-500">{groupTags.length} in use</p>
            </div>

            {tagError && <p className="text-sm text-red-500">{tagError}</p>}

            {groupTags.length ? (
              <div className="flex flex-wrap gap-2">
                {groupTags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2"
                  >
                    <span className="text-sm text-gray-800">{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag)}
                      className="text-xs font-medium text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tags in use yet.</p>
            )}
          </div>
        </section>
      )}

      {section === "settings" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-gray-200 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{group.name}</dd>
            </div>
            <div className="rounded border border-gray-200 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Currency
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{group.currency}</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
};

export default GroupDetail;
