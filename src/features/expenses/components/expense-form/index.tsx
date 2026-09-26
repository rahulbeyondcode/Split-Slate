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
      <form onSubmit={handleSave} noValidate className="min-h-[calc(100svh-72px)] flex flex-col">
        <fieldset
          disabled={methods.formState.isSubmitting}
          className="mx-auto grid w-full max-w-6xl flex-1 min-w-0 gap-6 px-5 py-8 md:grid-cols-2 md:items-start disabled:opacity-60"
        >
          <div className="surface form-card flex flex-col gap-5">
            <label className="block">
              <span className="field-label">Expense name</span>
              <Input name="expenseName" placeholder="Expense name…" autoFocus />
            </label>
            <label className="block">
              <span className="field-label">Amount ({group.currency})</span>
              <Input
                name="amount"
                inputMode="decimal"
                placeholder="0"
                className="!bg-[var(--brand-soft)] !border-0 !py-4 !text-3xl !font-extrabold money"
              />
            </label>
            <fieldset>
              <legend className="field-label">Category</legend>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <label key={category.id} className="cursor-pointer">
                    <input
                      type="radio"
                      value={category.id}
                      {...methods.register("categoryId")}
                      className="peer sr-only"
                    />
                    <span className="chip peer-checked:!bg-[var(--brand-soft)] peer-checked:!border-[var(--brand)] peer-checked:!text-[var(--brand-ink)]">
                      {category.icon} {category.name}
                      {category.isActive ? "" : " (inactive)"}
                    </span>
                  </label>
                ))}
              </div>
              {errors.categoryId && (
                <span role="alert" className="money-negative text-xs">
                  {errors.categoryId.message}
                </span>
              )}
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="flex flex-col gap-2">
                <legend className="field-label">Tags (optional)</legend>
                {groupTags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {groupTags.map((tag) => (
                      <label key={tag.id} className="chip cursor-pointer">
                        <input
                          type="checkbox"
                          value={tag.id}
                          {...methods.register("tagIds")}
                          className="accent-[var(--brand)]"
                        />
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="soft-caption">No tags in this group yet.</p>
                )}
              </fieldset>
              <label className="block">
                <span className="field-label">When</span>
                <Input name="when" type="datetime-local" />
              </label>
            </div>
            <p className="soft-caption">
              Notes and new attachments are not available yet. Existing expense data is preserved.
            </p>
          </div>
          <div className="surface form-card flex flex-col gap-5">
            <PayerSelector members={payerMembers} quickIds={quickIds} currency={group.currency} />
            <div className="border-t border-[var(--line)] pt-4">
              <SplitEditor members={members} currency={group.currency} />
            </div>
            {formError && (
              <p role="alert" className="note money-negative">
                {formError}
              </p>
            )}
          </div>
        </fieldset>
        <div className="form-toolbar">
          <span className="soft-caption max-sm:hidden">
            Expenses update balances as soon as they are saved.
          </span>
          <div className="flex gap-2 ml-auto">
            <Link to={cancelPath} className="btn btn-secondary">
              Cancel
            </Link>
            <button
              disabled={methods.formState.isSubmitting}
              type="submit"
              className="btn btn-primary"
            >
              {methods.formState.isSubmitting
                ? "Saving…"
                : expense
                  ? "Save changes"
                  : "Save expense"}
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default ExpenseForm;
