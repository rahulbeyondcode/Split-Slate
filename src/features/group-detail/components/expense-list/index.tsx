import { Link, useOutletContext } from "react-router-dom";

import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const ExpenseList = () => {
  const { group, groupExpenses, groupMembers, groupCategories } =
    useOutletContext<GroupDetailContext>();
  const sortedExpenses = groupExpenses.slice().sort((a, b) => b.when - a.when);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
      {sortedExpenses.length === 0 ? (
        <p className="text-sm text-gray-500">No expenses have been added yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedExpenses.map((expense) => (
            <li key={expense.expenseId} className="rounded border border-gray-200 px-4 py-3">
              <Link
                to={`/groups/${group.id}/expenses/${expense.expenseId}`}
                className="text-sm font-medium text-blue-700 hover:underline"
              >
                {expense.expenseName}
              </Link>
              <p className="text-xs text-gray-500">
                {formatCurrency(
                  expense.transactions.paid.reduce((sum, item) => sum + item.amount, 0),
                  group.currency,
                )}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Paid by{" "}
                {expense.transactions.paid
                  .map(
                    (payer) =>
                      groupMembers.find((member) => member.id === payer.memberId)?.person?.name ??
                      "Unknown person",
                  )
                  .join(", ")}
                {" · "}
                {new Date(expense.when).toLocaleString()}
                {" · "}
                {groupCategories.find((category) => category.id === expense.categoryId)?.name ??
                  "Unknown category"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ExpenseList;
