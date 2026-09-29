import { FolderPlus, Plus } from "lucide-react";
import { Link } from "react-router-dom";

import {
  dashboardCategories,
  dashboardPositions,
  dashboardTransfers,
} from "@/features/dashboard/utils/dashboard-data";
import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";

import Avatar from "@/shared/ui/avatar";
import BalanceHero from "@/shared/ui/balance-hero";
import EmojiImage from "@/shared/ui/emoji-image";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const Dashboard = () => {
  const state = useStore();
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
    <div className="page flex flex-col gap-8">
      <header>
        <p className="soft-caption mb-1">
          {new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(new Date())}
        </p>
        <h1 className="page-title">
          {greeting}, {state.localUser?.name ?? "there"}{" "}
          <EmojiImage icon={state.localUser?.icon} kind="profile" />
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
                  <p className="text-[11px] text-white/80">Total to get</p>
                  <strong className="money">{formatCurrency(get, currency)}</strong>
                </div>
                <div className="hero-box">
                  <p className="text-[11px] text-white/80">Total to give</p>
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
              const memberCount = state.members.filter(
                (member) => member.groupId === group.id,
              ).length;
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
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="soft-caption max-sm:hidden">
                        {amount > 0 ? "you are owed" : amount < 0 ? "you owe" : "settled"}
                      </p>
                      <strong
                        className={`money text-[22px] max-sm:text-[15px] ${amount > 0 ? "money-positive" : amount < 0 ? "money-negative" : "muted"}`}
                      >
                        {amount > 0 ? "+" : amount < 0 ? "−" : ""}
                        {formatCurrency(Math.abs(amount), group.currency)}
                      </strong>
                    </div>
                    <span
                      className={`chip border-0 max-sm:hidden ${amount > 0 ? "pill-positive" : amount < 0 ? "pill-negative" : ""}`}
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
          <Surface className="surface-pad">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Unsettled balances</h2>
              <Link to="/unsettled" className="chip chip-selected">
                {transfers.length}
              </Link>
            </div>
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
              <p className="muted mt-6">All square!</p>
            )}
          </Surface>
          {currency && (
            <Surface className="surface-pad">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Spending by category</h2>
                <span className="soft-caption">all groups · all time</span>
              </div>
              {categories.length ? (
                categories.map((category) => (
                  <div key={category.name} className="flex items-center gap-3 my-4">
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
                  </div>
                ))
              ) : (
                <p className="muted mt-6">No spending yet.</p>
              )}
            </Surface>
          )}
        </div>
      )}
      {entries.length > 0 && (
        <Link to="/groups/new" className="mobile-cta">
          <Icon icon={Plus} size={20} /> New group
        </Link>
      )}
    </div>
  );
};

export default Dashboard;
