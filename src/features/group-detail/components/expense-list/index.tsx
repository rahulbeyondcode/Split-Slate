import { useFormContext, useWatch } from "react-hook-form";
import { Link, useOutletContext } from "react-router-dom";

import ExpenseFilters from "@/features/expenses/components/expense-filters";

import {
  createExpenseFilterSchema,
  filterExpenses,
} from "@/features/expenses/utils/expense-filters";
import { formatCurrency } from "@/shared/utils/currency";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Surface from "@/shared/ui/surface";

const ExpenseList = () => {
  const { group, groupExpenses, groupMembers, groupCategories } =
    useOutletContext<GroupDetailContext>();
  const { control } = useFormContext<ExpenseFilterValues>();
  const values = useWatch({ control });
  const parsed = createExpenseFilterSchema(group.currency).safeParse(values);
  const sorted = parsed.success
    ? filterExpenses(groupExpenses, parsed.data, group.currency).sort((a, b) => b.when - a.when)
    : [];
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span role="status" className="soft-caption">
          {parsed.success
            ? `${sorted.length} of ${groupExpenses.length} expenses`
            : "Correct the highlighted filters to see results."}
        </span>
        <Link to={`/groups/${group.id}/expenses/new`} className="btn btn-primary max-sm:hidden">
          ＋ Add expense
        </Link>
      </div>
      <ExpenseFilters />
      {!parsed.success ? null : groupExpenses.length === 0 ? (
        <EmptyState
          icon="🍃"
          title="No expenses yet"
          description="The slate is clean. Add the first expense and the math begins."
          action={
            <Link to={`/groups/${group.id}/expenses/new`} className="btn btn-primary">
              ＋ Add expense
            </Link>
          }
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nothing matches"
          description="No expenses match these filters. Loosen one, or start fresh."
        />
      ) : (
        <Surface className="px-5">
          <ul aria-label="Expenses">
            {sorted.map((expense) => {
              const category = groupCategories.find((item) => item.id === expense.categoryId);
              const payers = expense.transactions.paid.map(
                (payer) =>
                  groupMembers.find((member) => member.id === payer.memberId)?.person?.name ??
                  "Unknown person",
              );
              const total = expense.transactions.paid.reduce((sum, item) => sum + item.amount, 0);
              return (
                <li key={expense.expenseId}>
                  <Link to={`/groups/${group.id}/expenses/${expense.expenseId}`} className="ui-row">
                    <Avatar icon={category?.icon} square className="!w-10 !h-10 !text-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{expense.expenseName}</span>
                      <span className="soft-caption block truncate">
                        {payers.join(", ")} paid · {expense.splitType}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="money block font-bold">
                        {formatCurrency(total, group.currency)}
                      </span>
                      <span className="soft-caption">
                        {new Intl.DateTimeFormat(undefined, {
                          day: "numeric",
                          month: "short",
                        }).format(expense.when)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Surface>
      )}
    </section>
  );
};

export default ExpenseList;
