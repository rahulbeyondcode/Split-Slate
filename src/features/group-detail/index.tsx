import { ArrowLeft, Plus } from "lucide-react";
import { Link, Navigate, Outlet, useLocation, useParams } from "react-router-dom";

import ExpenseFilterProvider from "@/features/expenses/components/expense-filter-provider";

import { useStore } from "@/shared/configs/store";
import { calculateGroupTotal, calculateMemberNet } from "@/shared/utils/balances";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import BalanceHero from "@/shared/ui/balance-hero";
import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";

const GroupDetail = () => {
  const { groupId } = useParams();
  const { pathname, search } = useLocation();
  const { groups, members, people, categories, tags, expenses, localUser } = useStore();
  if (!groupId) return <Navigate to="/dashboard" replace />;
  const group = groups.find((item) => item.id === groupId);
  if (!group)
    return (
      <div className="page page-narrow">
        <div className="surface empty-state">
          <h1 className="section-title">Group not found</h1>
          <p>This group is not available on this device.</p>
          <Link to="/dashboard" className="btn btn-secondary mt-4">
            Back to dashboard
          </Link>
        </div>
      </div>
    );

  const context: GroupDetailContext = {
    group,
    groupMembers: members
      .filter((member) => member.groupId === group.id)
      .map((member) => ({
        ...member,
        person: people.find((person) => person.id === member.personId),
      })),
    groupCategories: categories.filter((category) => category.groupId === group.id),
    groupTags: tags.filter((tag) => tag.groupId === group.id),
    groupExpenses: expenses.filter((expense) => expense.groupId === group.id),
  };
  const isExpenseForm = pathname.endsWith("/new") || pathname.endsWith("/edit");
  const isContainedPage = [
    `/groups/${groupId}/expenses`,
    `/groups/${groupId}/members`,
    `/groups/${groupId}/categories`,
  ].includes(pathname);
  const showGroupNavigation = [
    `/groups/${groupId}`,
    `/groups/${groupId}/expenses`,
    `/groups/${groupId}/balances`,
  ].includes(pathname);
  const showGroupHeader =
    showGroupNavigation ||
    [
      `/groups/${groupId}/members`,
      `/groups/${groupId}/categories`,
      `/groups/${groupId}/settings`,
    ].includes(pathname);
  const isOverview = pathname === `/groups/${groupId}`;
  const person = context.groupMembers.find((item) => item.personId === localUser?.id);
  const net = person ? calculateMemberNet(context.groupExpenses, person.id) : 0;
  const total = calculateGroupTotal(context.groupExpenses);

  return (
    <ExpenseFilterProvider key={group.id} currency={group.currency}>
      <div
        className={
          isExpenseForm
            ? "group-page group-page-form min-h-svh"
            : `group-page page flex flex-col gap-5${isContainedPage ? " group-page-contained" : ""}`
        }
      >
        {isExpenseForm ? (
          <header className="group-page-header flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <div className="flex items-center gap-3">
              <Link
                to={`/groups/${group.id}/expenses${search}`}
                className="btn btn-secondary !px-3"
                aria-label="Back to expenses"
              >
                <Icon icon={ArrowLeft} size={20} />
              </Link>
              <h1 className="section-title">
                {pathname.endsWith("/edit") ? "Edit expense" : "Add expense"}
              </h1>
              <span className="chip chip-selected">
                <EmojiImage icon={group.icon} /> {group.name}
              </span>
            </div>
          </header>
        ) : showGroupHeader ? (
          <>
            <header className="group-page-header flex flex-wrap items-center gap-4">
              <Avatar icon={group.icon} square className="!h-16 !w-16 !text-3xl" />
              <div className="flex-1 min-w-0">
                <h1 className="page-title">{group.name}</h1>
                <p className="soft-caption mt-[2px]">
                  {context.groupMembers.length} members · {context.groupExpenses.length} expenses ·{" "}
                  {formatCurrency(total, group.currency)} total · {group.currency}
                </p>
              </div>
              <div className="flex -space-x-2 max-sm:hidden">
                {context.groupMembers.slice(0, 5).map((member) => (
                  <Avatar
                    icon={member.person?.icon}
                    name={member.person?.name}
                    key={member.id}
                    className="border-2 border-[var(--page)]"
                  />
                ))}
              </div>
            </header>
            {isOverview && (
              <BalanceHero
                label="Your position in this group"
                amount={`${net < 0 ? "−" : net > 0 ? "+" : ""}${formatCurrency(Math.abs(net), group.currency)}`}
                description={
                  net < 0
                    ? "↑ you owe in this group"
                    : net > 0
                      ? "↓ you are owed in this group"
                      : "All square in this group"
                }
              />
            )}
          </>
        ) : (
          <header className="group-page-header">
            <h1 className="page-title">
              {pathname.endsWith("/members")
                ? "Members"
                : pathname.endsWith("/categories")
                  ? "Categories & Tags"
                  : pathname.endsWith("/settings")
                    ? "Group settings"
                    : "Expense detail"}
            </h1>
            <p className="soft-caption">
              <EmojiImage icon={group.icon} /> {group.name}
            </p>
          </header>
        )}
        <div className={isContainedPage ? "group-page-body" : undefined}>
          <Outlet context={context} />
        </div>
        {showGroupNavigation && (
          <Link className="mobile-cta" to={`/groups/${group.id}/expenses/new${search}`}>
            <Icon icon={Plus} size={20} /> Add expense
          </Link>
        )}
      </div>
    </ExpenseFilterProvider>
  );
};

export default GroupDetail;
