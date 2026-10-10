import { ArrowRight, Plus, ReceiptText } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

import ExpenseTags from "@/features/group-detail/components/expense-tags";
import SettlementEntry from "@/features/settlements/components/settlement-entry";

import { overviewMembers } from "@/features/group-detail/utils/overview-members";
import { calculateBalances, suggestTransfers } from "@/shared/utils/balances";
import { categorySpending } from "@/shared/utils/category-spending";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import CategorySpendingList from "@/shared/ui/category-spending-list";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const GroupOverview = () => {
  const { group, groupMembers, groupCategories, groupExpenses, groupSettlements, groupTags } =
    useOutletContext<GroupDetailContext>();
  const recent = [
    ...groupExpenses.map((expense) => ({ type: "expense" as const, when: expense.when, expense })),
    ...groupSettlements.map((settlement) => ({
      type: "payment" as const,
      when: settlement.when,
      settlement,
    })),
  ]
    .sort((a, b) => b.when - a.when)
    .slice(0, 5);
  const allCategories = categorySpending(groupExpenses, groupCategories);
  const categories = allCategories.slice(0, 6);
  const totalCategorySpend = allCategories.reduce((sum, category) => sum + category.amount, 0);
  const featuredMembers = overviewMembers(groupMembers, groupExpenses);
  const transfers = suggestTransfers(
    calculateBalances(
      groupExpenses,
      groupMembers.map((member) => member.id),
      groupSettlements,
    ),
  );
  const memberName = (id: string) =>
    groupMembers.find((member) => member.id === id)?.person?.name ?? "Unknown";
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
      <div className="responsive-grid overview-summary-grid">
        <Surface className="surface-pad overview-action-card">
          <h2 className="section-title mb-4">Members</h2>
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
          <div className="overview-card-cta-wrap">
            <Link to={`/groups/${group.id}/members`} className="overview-card-cta">
              <span>Manage Members ({groupMembers.length})</span>
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </div>
        </Surface>
        <Surface className="surface-pad overview-action-card">
          <h2 className="section-title">Suggested transfers</h2>
          {transfers.length ? (
            <ul className="overview-transfer-list mt-4">
              {transfers.slice(0, 3).map((transfer) => (
                <li
                  key={`${transfer.fromMemberId}-${transfer.toMemberId}`}
                  className="overview-transfer-row"
                >
                  <span className="overview-transfer-people">
                    <span>{memberName(transfer.fromMemberId)}</span>
                    <Icon icon={ArrowRight} size={14} />
                    <span>{memberName(transfer.toMemberId)}</span>
                  </span>
                  <strong className="money">
                    {formatCurrency(transfer.amount, group.currency)}
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 font-bold">All square!</p>
          )}
          <div className="overview-card-cta-wrap">
            <Link to={`/groups/${group.id}/balances`} className="overview-card-cta">
              <span>View all balances ({transfers.length})</span>
              <Icon icon={ArrowRight} size={16} />
            </Link>
          </div>
        </Surface>
      </div>
      <Surface className="recent-activity-card px-5">
        <div className="recent-activity-header flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Recent transactions</h2>
          <Link to={`/groups/${group.id}/expenses`} className="btn btn-secondary !px-3 shrink-0">
            View all ({groupExpenses.length + groupSettlements.length})
            <Icon icon={ArrowRight} size={16} />
          </Link>
        </div>
        {recent.length ? (
          <ul>
            {recent.map((entry) => {
              if (entry.type === "payment")
                return (
                  <li key={entry.settlement.id}>
                    <SettlementEntry
                      settlement={entry.settlement}
                      members={groupMembers}
                      tags={groupTags}
                      currency={group.currency}
                      to={`/groups/${group.id}/balances`}
                    />
                  </li>
                );
              const expense = entry.expense;
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
      </Surface>
      <section aria-label="Group spending by category">
        <Surface className="surface-pad">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="section-title">
                <Link to={`/groups/${group.id}/analytics`}>Spending by category</Link>
              </h2>
              <p className="soft-caption">This group · all time</p>
            </div>
            <Link to={`/groups/${group.id}/analytics`} className="btn btn-secondary !px-3 shrink-0">
              View all <Icon icon={ArrowRight} size={16} />
            </Link>
          </div>
          {categories.length ? (
            <CategorySpendingList
              categories={categories.map((category) => ({
                ...category,
                to: `/groups/${group.id}/analytics`,
              }))}
              currency={group.currency}
              totalAmount={totalCategorySpend}
            />
          ) : (
            <p className="muted mt-6">No spending yet.</p>
          )}
        </Surface>
      </section>
    </div>
  );
};

export default GroupOverview;
