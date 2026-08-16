import { useOutletContext } from "react-router-dom";

import { useStore } from "@/shared/configs/store";
import { calculateGroupTotal, calculateMemberNet } from "@/shared/utils/balances";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const GroupOverview = () => {
  const { group, groupMembers, groupCategories, groupExpenses } =
    useOutletContext<GroupDetailContext>();
  const localUser = useStore((state) => state.localUser);
  const localMember = groupMembers.find((member) => member.personId === localUser?.id);
  const localNet = localMember ? calculateMemberNet(groupExpenses, localMember.id) : 0;
  const totalSpend = calculateGroupTotal(groupExpenses);
  const recentExpenses = groupExpenses
    .slice()
    .sort((a, b) => b.when - a.when)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Your position</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {localNet === 0 ? "" : localNet > 0 ? "+" : "−"}
            {formatCurrency(Math.abs(localNet), group.currency)}
          </p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total spend</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {formatCurrency(totalSpend, group.currency)}
          </p>
        </div>
        <div className="rounded border border-gray-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Categories</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{groupCategories.length}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Members</h2>
        <ul className="flex flex-col gap-2">
          {groupMembers.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2"
            >
              <span>{member.person?.icon}</span>
              <span className="text-sm text-gray-900">
                {member.person?.name ?? "Unknown person"}
              </span>
              {member.personId === localUser?.id && (
                <span className="text-xs text-gray-400">You</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Recent expenses</h2>
        {recentExpenses.length === 0 ? (
          <p className="text-sm text-gray-500">No expenses in this group yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentExpenses.map((expense) => {
              const category = groupCategories.find((item) => item.id === expense.categoryId);
              const paidTotal = expense.transactions.paid.reduce(
                (sum, transaction) => sum + transaction.amount,
                0,
              );

              return (
                <li
                  key={expense.expenseId}
                  className="flex items-center justify-between gap-3 rounded border border-gray-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {expense.expenseName}
                    </p>
                    <p className="text-xs text-gray-500">{category?.name ?? "Unknown category"}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-gray-900">
                    {formatCurrency(paidTotal, group.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default GroupOverview;
