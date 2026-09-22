import { zodResolver } from "@hookform/resolvers/zod";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";

import PayerSelector from "@/features/expenses/components/payer-selector";
import SplitEditor from "@/features/expenses/components/split-editor";
import Input from "@/shared/components/form-elements/input";

import {
  expenseFormMembers,
  expenseFormValues,
  localDateTime,
} from "@/features/expenses/utils/expense-form-values";
import { createExpenseSchema } from "@/features/expenses/utils/expense-schema";
import { defaultPayer, rankPayers } from "@/features/expenses/utils/paid-by";
import { useStore } from "@/shared/configs/store";

import type { ExpenseFormValues } from "@/features/expenses/types/expenses.types";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const ExpenseForm = () => {
  const { group, groupMembers, groupCategories, groupTags, groupExpenses } =
    useOutletContext<GroupDetailContext>();
  const { localUser, addExpense, updateExpense } = useStore();
  const { expenseId } = useParams();
  const expense = groupExpenses.find((item) => item.expenseId === expenseId);
  const [openedAt] = useState(Date.now);
  const navigate = useNavigate();
  const saving = useRef(false);
  const members = expenseFormMembers(
    groupMembers
      .filter((member) => member.person)
      .map((member) => ({ id: member.id, name: member.person!.name })),
    expense,
  );
  const creatorId = groupMembers.find((member) => member.personId === localUser?.id)?.id ?? "";
  const categories = groupCategories.filter(
    (category) => category.isActive || category.id === expense?.categoryId,
  );
  const initialValues: ExpenseFormValues = expense
    ? expenseFormValues(expense, members, group.currency)
    : {
        expenseName: "",
        amount: "",
        when: localDateTime(openedAt),
        categoryId: categories[0]?.id ?? "",
        tagIds: [],
        payerMode: "single",
        payerId: defaultPayer(members, groupExpenses, creatorId),
        payers: members.map((member) => ({ memberId: member.id, amount: "" })),
        splitType: "equal",
        participants: members.map((member) => ({ memberId: member.id, selected: true, value: "" })),
      };
  const methods = useForm<ExpenseFormValues>({
    resolver: zodResolver(createExpenseSchema(group.currency)),
    values: initialValues,
  });
  const payerMembers = initialValues.payers.flatMap((payer) =>
    members.filter((member) => member.id === payer.memberId),
  );
  const cancelPath = expense
    ? `/groups/${group.id}/expenses/${expense.expenseId}`
    : `/groups/${group.id}/expenses`;
  const quickIds = groupExpenses.length
    ? group.frequentPayerIds
    : [...new Set([creatorId, ...rankPayers(members, [])])].filter(Boolean).slice(0, 5);
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true;
    try {
      await methods.handleSubmit(async (values) => {
        try {
          const input = { groupId: group.id, currency: group.currency, values };
          if (expenseId) {
            await updateExpense(expenseId, input);
            navigate(`/groups/${group.id}/expenses/${expenseId}`);
          } else {
            await addExpense(input);
            navigate(`/groups/${group.id}/expenses`);
          }
        } catch (error) {
          methods.setError("root", {
            message:
              error instanceof Error ? error.message : "Could not save expense. Please try again.",
          });
        }
      })(event);
    } finally {
      saving.current = false;
    }
  };
  const errors = methods.formState.errors;
  const formError =
    errors.root?.message ?? errors.participants?.root?.message ?? errors.participants?.message;

  if (expenseId && !expense)
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Expense not found</h2>
        <p>This expense is not available in this group.</p>
        <Link to={`/groups/${group.id}/expenses`} className="text-blue-700">
          Back to expenses
        </Link>
      </section>
    );

  if (!creatorId || !members.length || !categories.length)
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{expense ? "Edit expense" : "Add expense"}</h2>
        <p role="alert">
          This group needs your membership and an active category before you can record an expense.
        </p>
        <Link to={`/groups/${group.id}/categories`} className="text-blue-700">
          Manage categories
        </Link>
      </section>
    );

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSave} noValidate className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold">{expense ? "Edit expense" : "Add expense"}</h2>
        <fieldset
          disabled={methods.formState.isSubmitting}
          className="flex min-w-0 flex-col gap-5 disabled:opacity-60"
        >
          <label className="flex flex-col gap-1 text-sm">
            Expense name
            <Input name="expenseName" placeholder="Dinner, groceries, taxi…" autoFocus />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Amount ({group.currency})<Input name="amount" inputMode="decimal" placeholder="0" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Date and time
              <Input name="when" type="datetime-local" />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Category
            <select
              {...methods.register("categoryId")}
              className="rounded border border-gray-300 px-3 py-2"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                  {category.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <span role="alert" className="text-red-600">
                {errors.categoryId.message}
              </span>
            )}
          </label>
          <PayerSelector members={payerMembers} quickIds={quickIds} currency={group.currency} />
          <SplitEditor members={members} currency={group.currency} />
          {groupTags.length > 0 && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold">Tags (optional)</legend>
              <div className="flex flex-wrap gap-3">
                {groupTags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" value={tag.id} {...methods.register("tagIds")} />
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {formError && (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          )}
          <div className="flex items-center justify-end gap-4">
            <Link to={cancelPath} className="text-sm text-gray-600">
              Cancel
            </Link>
            <button type="submit" className="rounded bg-gray-900 px-4 py-2 text-sm text-white">
              {methods.formState.isSubmitting
                ? "Saving…"
                : expense
                  ? "Save changes"
                  : "Save expense"}
            </button>
          </div>
        </fieldset>
      </form>
    </FormProvider>
  );
};

export default ExpenseForm;
