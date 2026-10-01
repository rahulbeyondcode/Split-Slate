import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";

import { calculateBalances, suggestTransfers } from "@/shared/utils/balances";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const GroupBalances = () => {
  const navigate = useNavigate();
  const { group, groupMembers, groupExpenses } = useOutletContext<GroupDetailContext>();
  let balances: Map<string, number>;
  let transfers: ReturnType<typeof suggestTransfers>;
  try {
    balances = calculateBalances(
      groupExpenses,
      groupMembers.map((member) => member.id),
    );
    transfers = suggestTransfers(balances);
  } catch (error) {
    return (
      <p role="alert" className="note money-negative">
        {error instanceof Error ? error.message : "Could not calculate balances"}
      </p>
    );
  }
  const person = (id: string) => groupMembers.find((member) => member.id === id)?.person;
  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(`/groups/${group.id}/expenses`);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <button type="button" className="page-back-link" onClick={handleBack}>
        <Icon icon={ArrowLeft} size={18} /> Back
      </button>
      <div className="responsive-grid">
        <Surface className="surface-pad">
          <h2 className="section-title mb-3">Net per member</h2>
          <ul aria-label="Member balances">
            {groupMembers.map((member) => {
              const net = balances.get(member.id) ?? 0;
              return (
                <li key={member.id} className="ui-row">
                  <Avatar icon={member.person?.icon} name={member.person?.name} />
                  <span className="flex-1 font-bold">
                    {member.person?.name ?? "Unknown person"}
                  </span>
                  <span
                    className={`money font-bold ${net > 0 ? "money-positive" : net < 0 ? "money-negative" : "muted"}`}
                  >
                    {net > 0 ? "+" : net < 0 ? "−" : ""}
                    {formatCurrency(Math.abs(net), group.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Surface>
        <Surface className="surface-pad">
          <h2 className="section-title mb-3">Who owes whom</h2>
          <section aria-label="Suggested payments">
            {transfers.length ? (
              <ul>
                {transfers.map((transfer) => (
                  <li
                    key={`${transfer.fromMemberId}-${transfer.toMemberId}`}
                    className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[var(--line)] py-3 last:border-b-0"
                  >
                    <span className="transfer-person flex min-w-0 items-center gap-1.5 text-xs font-bold">
                      <Avatar icon={person(transfer.fromMemberId)?.icon} className="!h-8 !w-8" />
                      <span className="max-w-[11ch] truncate">
                        {person(transfer.fromMemberId)?.name ?? "Unknown"}
                      </span>
                    </span>
                    <Icon icon={ArrowRight} size={18} className="text-[var(--muted)]" />
                    <span className="transfer-person flex min-w-0 items-center gap-1.5 text-xs font-bold">
                      <Avatar icon={person(transfer.toMemberId)?.icon} className="!h-8 !w-8" />
                      <span className="max-w-[11ch] truncate">
                        {person(transfer.toMemberId)?.name ?? "Unknown"}
                      </span>
                    </span>
                    <strong className="money ml-auto whitespace-nowrap text-xs">
                      {formatCurrency(transfer.amount, group.currency)}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={CircleCheck}
                title="All square!"
                description={
                  groupMembers.length === 1
                    ? "Solo spending has no one to repay."
                    : "No payments needed."
                }
              />
            )}
          </section>
          <p className="note mt-4">Suggested transfers only — no payment is recorded.</p>
        </Surface>
      </div>
    </div>
  );
};

export default GroupBalances;
