import { useOutletContext } from "react-router-dom";

import { formatMoney } from "@/features/group-detail/utils/format-money";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const ExpenseList = () => {
  const { group, groupExpenses } = useOutletContext<GroupDetailContext>();
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
  );
};

export default ExpenseList;
