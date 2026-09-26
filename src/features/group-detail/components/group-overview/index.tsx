import { Link, useOutletContext } from "react-router-dom";

import { calculateBalances, suggestTransfers } from "@/shared/utils/balances";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Surface from "@/shared/ui/surface";

const GroupOverview = () => {
  const { group, groupMembers, groupCategories, groupExpenses } =
    useOutletContext<GroupDetailContext>();
  const recent = groupExpenses
    .slice()
    .sort((a, b) => b.when - a.when)
    .slice(0, 5);
  const transfers = suggestTransfers(
    calculateBalances(
      groupExpenses,
      groupMembers.map((member) => member.id),
    ),
  );
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">Recent expenses</h2>
        <Link to={`/groups/${group.id}/expenses/new`} className="btn btn-primary max-sm:hidden">
          ＋ Add expense
        </Link>
      </div>
      {recent.length ? (
        <Surface className="px-5">
          {recent.map((expense) => {
            const category = groupCategories.find((item) => item.id === expense.categoryId);
            return (
              <Link
                key={expense.expenseId}
                to={`/groups/${group.id}/expenses/${expense.expenseId}`}
                className="ui-row"
              >
                <Avatar icon={category?.icon} square className="!h-10 !w-10 !text-xl" />
                <div className="flex-1">
                  <p className="font-bold">{expense.expenseName}</p>
                  <p className="soft-caption">
                    {category?.name ?? "Category"} · {expense.splitType}
                  </p>
                </div>
                <span className="money font-bold">
                  {formatCurrency(
                    expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
                    group.currency,
                  )}
                </span>
              </Link>
            );
          })}
        </Surface>
      ) : (
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
      )}
      <div className="responsive-grid">
        <Surface className="surface-pad">
          <h2 className="section-title mb-4">Members</h2>
          <div className="flex flex-wrap gap-2">
            {groupMembers.map((member) => (
              <Link key={member.id} to={`/groups/${group.id}/members`} className="chip">
                <Avatar
                  icon={member.person?.icon}
                  name={member.person?.name}
                  className="!w-7 !h-7 !text-sm"
                />
                {member.person?.name ?? "Unknown"}
              </Link>
            ))}
          </div>
        </Surface>
        <Surface className="surface-pad">
          <h2 className="section-title">Suggested transfers</h2>
          <p className="soft-caption mt-1">These suggestions do not record payments.</p>
          <p className="mt-4 font-bold">
            {transfers.length
              ? `${transfers.length} ${transfers.length === 1 ? "transfer" : "transfers"} to settle`
              : "All square!"}
          </p>
          <Link to={`/groups/${group.id}/balances`} className="btn btn-secondary mt-4">
            View all balances →
          </Link>
        </Surface>
      </div>
    </div>
  );
};

export default GroupOverview;
