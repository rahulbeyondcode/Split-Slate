import { useOutletContext } from "react-router-dom";

import { calculateBalances, suggestTransfers } from "@/shared/utils/balances";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const GroupBalances = () => {
  const { group, groupMembers, groupExpenses } = useOutletContext<GroupDetailContext>();
  let balances;
  let transfers;
  try {
    balances = calculateBalances(
      groupExpenses,
      groupMembers.map((member) => member.id),
    );
    transfers = suggestTransfers(balances);
  } catch (error) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Balances</h2>
        <p role="alert">
          {error instanceof Error ? error.message : "Could not calculate balances"}
        </p>
      </section>
    );
  }
  const name = (id: string) =>
    groupMembers.find((member) => member.id === id)?.person?.name ?? "Unknown person";

  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Balances</h2>
      {!groupExpenses.length && (
        <p className="text-sm text-gray-600">
          No expenses yet. Add an expense to see who owes whom.
        </p>
      )}
      {groupMembers.length === 1 && (
        <p className="text-sm text-gray-600">
          This is a solo group. Your expenses track personal spending; there is no one to repay.
        </p>
      )}
      <ul aria-label="Member balances" className="flex flex-col gap-2">
        {groupMembers.map((member) => {
          const net = balances.get(member.id) ?? 0;
          return (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 p-3"
            >
              <span>
                {member.person?.icon} {name(member.id)}
              </span>
              <span className="text-sm">
                {net === 0
                  ? "No balance"
                  : `${net > 0 ? "Is owed" : "Owes"} ${formatCurrency(Math.abs(net), group.currency)}`}
              </span>
            </li>
          );
        })}
      </ul>
      <section aria-label="Suggested payments" className="flex flex-col gap-3">
        <h3 className="font-semibold">Suggested payments</h3>
        <p className="text-sm text-gray-600">
          One way to settle the current balances. These suggestions do not record a payment.
        </p>
        {transfers.length ? (
          <ul className="flex flex-col gap-2">
            {transfers.map((transfer) => (
              <li
                key={`${transfer.fromMemberId}-${transfer.toMemberId}`}
                className="rounded border border-gray-200 p-3 text-sm"
              >
                {name(transfer.fromMemberId)} pays {name(transfer.toMemberId)}{" "}
                <strong>{formatCurrency(transfer.amount, group.currency)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No payments needed.</p>
        )}
      </section>
    </section>
  );
};

export default GroupBalances;
