import { ArrowRight, Plus, ReceiptText } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

import ExpenseTags from "@/features/group-detail/components/expense-tags";

import { overviewMembers } from "@/features/group-detail/utils/overview-members";
import { useViewport } from "@/shared/hooks/use-viewport";
import { calculateBalances, suggestTransfers } from "@/shared/utils/balances";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const GroupOverview = () => {
  const { isMobile } = useViewport();
  const { group, groupMembers, groupCategories, groupExpenses, groupTags } =
    useOutletContext<GroupDetailContext>();
  const recent = groupExpenses
    .slice()
    .sort((a, b) => b.when - a.when)
    .slice(0, 3);
  const featuredMembers = overviewMembers(groupMembers, groupExpenses);
  const showMemberDetails = !isMobile || featuredMembers.length < groupMembers.length;
  const transfers = suggestTransfers(
    calculateBalances(
      groupExpenses,
      groupMembers.map((member) => member.id),
    ),
  );
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="section-title">At a glance</h2>
        {recent.length > 0 && (
          <Link to={`/groups/${group.id}/expenses/new`} className="btn btn-primary max-sm:hidden">
            <Icon icon={Plus} size={18} /> Add expense
          </Link>
        )}
      </div>
      <div className="responsive-grid">
        <Surface className="surface-pad">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="section-title">
              Members{showMemberDetails ? ` (${groupMembers.length})` : ""}
            </h2>
            {showMemberDetails && (
              <Link
                to={`/groups/${group.id}/members`}
                className="text-sm font-bold text-[var(--brand-ink)]"
              >
                View all members <Icon icon={ArrowRight} size={16} />
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {featuredMembers.map((member) => (
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
            View all balances <Icon icon={ArrowRight} size={16} />
          </Link>
        </Surface>
      </div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">Recent expenses ({groupExpenses.length})</h2>
        <Link
          to={`/groups/${group.id}/expenses`}
          className="text-sm font-bold text-[var(--brand-ink)]"
        >
          View all expenses <Icon icon={ArrowRight} size={16} />
        </Link>
      </div>
      {recent.length ? (
        <Surface className="px-5">
          <ul>
            {recent.map((expense) => {
              const category = groupCategories.find((item) => item.id === expense.categoryId);
              return (
                <li
                  key={expense.expenseId}
                  className="border-b border-[var(--line)] last:border-b-0"
                >
                  <Link
                    to={`/groups/${group.id}/expenses/${expense.expenseId}`}
                    className="expense-entry-link flex min-w-0 items-center gap-3 py-3"
                  >
                    <Avatar icon={category?.icon} square className="!h-10 !w-10 !text-xl" />
                    <div className="expense-entry-copy min-w-0 flex-1">
                      <p className="expense-entry-title truncate font-bold">
                        {expense.expenseName}
                      </p>
                      <p className="expense-entry-meta soft-caption truncate">
                        {category?.name ?? "Category"} · {expense.splitType}
                      </p>
                    </div>
                    <span className="expense-entry-amount money shrink-0 font-bold">
                      {formatCurrency(
                        expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
                        group.currency,
                      )}
                    </span>
                  </Link>
                  <ExpenseTags
                    tagIds={expense.tagIds}
                    tags={groupTags}
                    expenseName={expense.expenseName}
                    className="mb-3 pl-[52px]"
                  />
                </li>
              );
            })}
          </ul>
        </Surface>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title="No expenses yet"
          description="The slate is clean. Add the first expense and the math begins."
          action={
            <Link to={`/groups/${group.id}/expenses/new`} className="btn btn-primary">
              <Icon icon={Plus} size={18} /> Add expense
            </Link>
          }
        />
      )}
    </div>
  );
};

export default GroupOverview;
