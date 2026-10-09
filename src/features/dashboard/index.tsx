import { ArrowRight, FolderPlus, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import {
  dashboardCategories,
  dashboardPositions,
  dashboardTransfers,
} from "@/features/dashboard/utils/dashboard-data";
import { useStore } from "@/shared/configs/store";
import { useViewport } from "@/shared/hooks/use-viewport";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDisplayDate } from "@/shared/utils/date-time";

import Avatar from "@/shared/ui/avatar";
import BalanceHero from "@/shared/ui/balance-hero";
import EmojiImage from "@/shared/ui/emoji-image";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const Dashboard = () => {
  const state = useStore();
  const { isMobile } = useViewport();
  const { entries, currency, get, give } = dashboardPositions(state);
  const transfers = dashboardTransfers(state);
  const categories = currency ? dashboardCategories(state, currency).slice(0, 6) : [];
  const maxCategory = categories[0]?.amount || 1;
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="page dashboard-page flex flex-col gap-8">
      <header>
        <p className="soft-caption mb-1">{formatDisplayDate(new Date())}</p>
        <h1 className="page-title flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            {greeting}, {state.localUser?.name ?? "there"}
          </span>
          <EmojiImage
            icon={state.localUser?.icon}
            kind="profile"
            className="!h-[1.2em] !w-[1.2em]"
          />
        </h1>
      </header>

      {currency ? (
        <BalanceHero
          label={
            get === give
              ? "You're all settled"
              : get > give
                ? "You're owed overall"
                : "You owe overall"
          }
          amount={formatCurrency(Math.abs(get - give), currency)}
          description={
            entries.length
              ? `Across ${entries.length} ${entries.length === 1 ? "group" : "groups"} · ${transfers.length} suggested ${transfers.length === 1 ? "transfer" : "transfers"}`
              : "Nothing to get, nothing to give — yet."
          }
          extra={
            entries.length ? (
              <>
                <div className="hero-box">
                  <p className="text-[0.6875rem] text-white/80">Total to get</p>
                  <strong className="money">{formatCurrency(get, currency)}</strong>
                </div>
                <div className="hero-box">
                  <p className="text-[0.6875rem] text-white/80">Total to give</p>
                  <strong className="money">{formatCurrency(give, currency)}</strong>
                </div>
              </>
            ) : undefined
          }
        />
      ) : (
        <BalanceHero
          label="Overall balance"
          description={
            entries.length
              ? "Your groups use multiple currencies. See each group for its exact balance."
              : "Start by creating your first group."
          }
          amount={entries.length ? "Multiple currencies in use" : undefined}
        />
      )}

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="section-title">Your groups</h2>
          {entries.length > 0 && (
            <Link to="/groups/new" className="btn btn-primary max-sm:hidden">
              <Icon icon={Plus} size={18} /> New group
            </Link>
          )}
        </div>
        {!entries.length ? (
          <EmptyState
            icon={FolderPlus}
            title="Create your first group"
            description="A trip, a flat, a lunch club — everything starts with a group."
            action={
              <div className="flex justify-center gap-3">
                <Link className="btn btn-primary" to="/groups/new">
                  <Icon icon={Plus} size={18} /> New group
                </Link>
                <Link className="btn btn-secondary" to="/import">
                  Import group
                </Link>
              </div>
            }
          />
        ) : (
          <div className="group-cards">
            {entries.map(({ group, amount }) => {
              const groupMembers = state.members.filter((member) => member.groupId === group.id);
              const memberCount = groupMembers.length;
              const expenseCount = state.expenses.filter(
                (expense) => expense.groupId === group.id,
              ).length;
              return (
                <Link key={group.id} to={`/groups/${group.id}`} className="surface group-card">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar icon={group.icon} square />
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{group.name}</h3>
                      <p className="soft-caption">
                        {memberCount} members · {expenseCount} expenses
                      </p>
                      {memberCount > 0 && (
                        <div
                          role="group"
                          aria-label="Group members"
                          className="dashboard-group-members mt-2 flex flex-wrap items-center gap-1"
                        >
                          {groupMembers.slice(0, 5).map((member) => {
                            const person = state.people.find((item) => item.id === member.personId);
                            const name = person?.name ?? "Unknown member";
                            return (
                              <span key={member.id} role="img" aria-label={name} title={name}>
                                <Avatar
                                  icon={person?.icon}
                                  name={name}
                                  className="!h-6 !w-6 !text-xs"
                                />
                              </span>
                            );
                          })}
                          {memberCount > 5 && (
                            <span
                              aria-label={`${memberCount - 5} more members`}
                              className="px-1 text-xs font-semibold muted"
                            >
                              +{memberCount - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="dashboard-group-balance flex items-end justify-between gap-2">
                    <div>
                      <p className="soft-caption max-sm:hidden">
                        {amount > 0 ? "you are owed" : amount < 0 ? "you owe" : "settled"}
                      </p>
                      <strong
                        className={`dashboard-group-amount money text-[1.375rem] max-sm:text-[0.9375rem] ${amount > 0 ? "money-positive" : amount < 0 ? "money-negative" : "muted"}`}
                      >
                        {amount > 0 ? "+" : amount < 0 ? "−" : ""}
                        {formatCurrency(Math.abs(amount), group.currency)}
                      </strong>
                    </div>
                    <span
                      className={`dashboard-group-status chip border-0 ${amount > 0 ? "pill-positive" : amount < 0 ? "pill-negative" : ""}`}
                    >
                      {amount > 0 ? "↓ collect" : amount < 0 ? "↑ settle" : "settled"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {entries.length > 0 && (
        <div className="dashboard-lower max-sm:hidden">
          <section
            aria-labelledby="dashboard-unsettled-title"
            className="dashboard-preview mt-4 flex min-w-0 flex-col gap-3"
          >
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 id="dashboard-unsettled-title" className="section-title">
                  Unsettled balances
                </h2>
                {isMobile && <p className="soft-caption">Across all groups</p>}
              </div>
              <Link to="/unsettled" className="btn btn-secondary !px-3 shrink-0">
                View all ({transfers.length}) <Icon icon={ArrowRight} size={16} />
              </Link>
            </header>
            <Surface className="surface-pad flex-1">
              {transfers.length ? (
                transfers.slice(0, 5).map((transfer) => (
                  <Link
                    key={transfer.key}
                    to={`/groups/${transfer.group.id}/balances`}
                    className="ui-row"
                  >
                    <Avatar icon={transfer.person?.icon} name={transfer.person?.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">
                        {transfer.incoming
                          ? `${transfer.person?.name ?? "Someone"} owes you`
                          : `You owe ${transfer.person?.name ?? "someone"}`}
                      </p>
                      <p className="soft-caption">{transfer.group.name}</p>
                    </div>
                    <strong
                      className={`money ${transfer.incoming ? "money-positive" : "money-negative"}`}
                    >
                      {transfer.incoming ? "+" : "−"}
                      {formatCurrency(transfer.amount, transfer.group.currency)}
                    </strong>
                  </Link>
                ))
              ) : (
                <p className="muted">All square!</p>
              )}
            </Surface>
          </section>
          {currency && (
            <section
              aria-labelledby="dashboard-category-title"
              className="dashboard-preview mt-4 flex min-w-0 flex-col gap-3"
            >
              {isMobile ? (
                <header className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 id="dashboard-category-title" className="section-title">
                      <Link to="/analytics">Spending by category</Link>
                    </h2>
                    <p className="soft-caption">All groups · ever</p>
                  </div>
                  <Link to="/analytics" className="btn btn-secondary !px-3 shrink-0">
                    View all <Icon icon={ArrowRight} size={16} />
                  </Link>
                </header>
              ) : (
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="dashboard-category-title" className="section-title">
                    <Link to="/analytics">Spending by category</Link>
                  </h2>
                  <span className="soft-caption">all groups · all time</span>
                </header>
              )}
              <Surface className="surface-pad flex-1">
                {categories.length ? (
                  categories.map((category) => (
                    <Link
                      key={category.name}
                      to="/analytics"
                      className="flex items-center gap-3 my-4"
                    >
                      <EmojiImage icon={category.icon} />
                      <span className="w-24 truncate text-xs font-semibold">{category.name}</span>
                      <div className="h-2 flex-1 rounded-full bg-[var(--surface-soft)]">
                        <div
                          className="h-2 rounded-full bg-[var(--brand)]"
                          style={{ width: `${(category.amount / maxCategory) * 100}%` }}
                        />
                      </div>
                      <span className="money text-xs">
                        {formatCurrency(category.amount, currency)}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="muted">No spending yet.</p>
                )}
              </Surface>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
