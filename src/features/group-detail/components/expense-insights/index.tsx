import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { calculateExpenseInsights } from "@/features/group-detail/utils/expense-insights";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Expense } from "@/shared/types/domain.types";

import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

interface PropsType {
  expenses: Expense[];
  group: GroupDetailContext["group"];
  members: GroupDetailContext["groupMembers"];
  categories: GroupDetailContext["groupCategories"];
  filtered: boolean;
}

const ExpenseInsights = ({ expenses, group, members, categories, filtered }: PropsType) => {
  let insights: ReturnType<typeof calculateExpenseInsights>;
  try {
    insights = calculateExpenseInsights(expenses, members, categories);
  } catch (error) {
    return (
      <p role="alert" className="note money-negative">
        {error instanceof Error ? error.message : "Could not calculate expense insights"}
      </p>
    );
  }

  const money = (amount: number) => formatCurrency(amount, group.currency);

  return (
    <section aria-label="Expense insights">
      <Surface className="expense-insights-banner overflow-hidden !rounded-[18px]">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-sm font-bold">Expense insights</h3>
            <p className="soft-caption">
              {filtered ? "Matching expenses only" : "All expenses in this group"}
            </p>
          </div>
          <Link
            to={`/groups/${group.id}/balances`}
            aria-label="View full-group balances"
            className="btn btn-secondary !min-h-9 !px-3 !py-2"
          >
            <span className="max-sm:hidden">View full-group balances</span>
            <span className="sm:hidden">Full balances</span>
            <Icon icon={ArrowUpRight} size={16} />
          </Link>
        </div>
        <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center sm:gap-4 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <p className="soft-caption">Total paid</p>
            <p className="money mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
              {money(insights.total)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--line)] pt-2 text-sm sm:grid-cols-3 sm:gap-y-3 sm:border-t-0 sm:border-l sm:py-1 sm:pl-5">
            <div>
              <p className="soft-caption">Expenses</p>
              <strong className="block mt-1">{expenses.length}</strong>
            </div>
            <div>
              <p className="soft-caption">Avg. / expense (rounded)</p>
              <strong className="money block mt-1">{money(insights.average)}</strong>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="soft-caption">Top category by spend</p>
              <strong className="block mt-1">{insights.topCategory?.name ?? "—"}</strong>
              {insights.topCategory && (
                <span className="money soft-caption">{money(insights.topCategory.amount)}</span>
              )}
            </div>
          </div>
        </div>
      </Surface>
    </section>
  );
};

export default ExpenseInsights;
