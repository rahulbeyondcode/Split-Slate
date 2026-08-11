import { useOutletContext } from "react-router-dom";

import { formatMoney } from "@/features/group-detail/utils/format-money";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const GroupOverview = () => {
  const { group, groupMembers, groupExpenses } = useOutletContext<GroupDetailContext>();
  const totalSpend = groupExpenses.reduce(
    (sum, expense) =>
      sum + expense.transactions.paid.reduce((paidSum, item) => paidSum + item.amount, 0),
    0,
  );

  return (
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
  );
};

export default GroupOverview;
