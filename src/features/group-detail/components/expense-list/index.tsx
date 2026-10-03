import { Plus, ReceiptText, SearchX } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Link, useLocation, useOutletContext } from "react-router-dom";

import ExpenseFilters from "@/features/expenses/components/expense-filters";
import ExpenseInsights from "@/features/group-detail/components/expense-insights";
import ExpenseTags from "@/features/group-detail/components/expense-tags";

import {
  countActiveExpenseFilters,
  createExpenseFilterSchema,
  filterExpenses,
  sortExpenses,
} from "@/features/expenses/utils/expense-filters";
import { useViewport } from "@/shared/hooks/use-viewport";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDisplayDateTime } from "@/shared/utils/date-time";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const ExpenseList = () => {
  const { isMobile } = useViewport();
  const ledgerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLElement>(null);
  const { search } = useLocation();
  const { group, groupExpenses, groupMembers, groupCategories, groupTags } =
    useOutletContext<GroupDetailContext>();
  const { control } = useFormContext<ExpenseFilterValues>();
  const values = useWatch({ control });
  const parsed = createExpenseFilterSchema(group.currency).safeParse(values);
  const hasFilters = parsed.success && countActiveExpenseFilters(parsed.data) > 0;
  const sorted = parsed.success
    ? sortExpenses(
        filterExpenses(groupExpenses, parsed.data, group.currency),
        parsed.data.sort,
        groupCategories,
        groupTags,
      )
    : [];
  useLayoutEffect(() => {
    const ledger = ledgerRef.current;
    const title = titleRef.current;
    const groupHeader = ledger
      ?.closest(".group-page")
      ?.querySelector<HTMLElement>(".group-page-header");
    if (!isMobile || !ledger || !title || !groupHeader) return;

    const updateOffsets = () => {
      ledger.style.setProperty("--expense-group-header-height", `${groupHeader.offsetHeight}px`);
      ledger.style.setProperty("--expense-title-height", `${title.offsetHeight}px`);
    };
    const observer = new ResizeObserver(updateOffsets);
    observer.observe(groupHeader);
    observer.observe(title);
    updateOffsets();
    return () => {
      observer.disconnect();
      ledger.style.removeProperty("--expense-group-header-height");
      ledger.style.removeProperty("--expense-title-height");
    };
  }, [isMobile]);

  return (
    <section ref={ledgerRef} className="expense-ledger flex flex-col gap-4">
      <header ref={titleRef} className="flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">All expenses</h2>
          <p className="soft-caption mt-1">Search and filter your complete expense history.</p>
        </div>
        <Link
          to={`/groups/${group.id}/expenses/new${search}`}
          className="btn btn-primary max-sm:!hidden"
        >
          <Icon icon={Plus} size={18} /> Add expense
        </Link>
      </header>
      {parsed.success && (
        <ExpenseInsights
          expenses={sorted}
          group={group}
          members={groupMembers}
          categories={groupCategories}
          filtered={hasFilters}
        />
      )}
      <ExpenseFilters />
      {(!isMobile || hasFilters || !parsed.success) && (
        <span role="status" className="soft-caption">
          {parsed.success
            ? `${sorted.length} of ${groupExpenses.length} expenses`
            : "Correct the highlighted filters to see results."}
        </span>
      )}
      {!parsed.success ? null : groupExpenses.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No expenses yet"
          description="The slate is clean. Add the first expense and the math begins."
          action={
            <Link to={`/groups/${group.id}/expenses/new${search}`} className="btn btn-primary">
              <Icon icon={Plus} size={18} /> Add expense
            </Link>
          }
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nothing matches"
          description="No expenses match these filters. Loosen one, or start fresh."
        />
      ) : (
        <Surface className="expense-ledger-list px-5">
          <ul aria-label="Expenses">
            {sorted.map((expense) => {
              const category = groupCategories.find((item) => item.id === expense.categoryId);
              const payers = expense.transactions.paid.map(
                (payer) =>
                  groupMembers.find((member) => member.id === payer.memberId)?.person?.name ??
                  "Unknown person",
              );
              const total = expense.transactions.paid.reduce((sum, item) => sum + item.amount, 0);
              return (
                <li
                  key={expense.expenseId}
                  className="border-b border-[var(--line)] last:border-b-0"
                >
                  <Link
                    to={`/groups/${group.id}/expenses/${expense.expenseId}${search}`}
                    className="expense-entry-link flex min-w-0 items-center gap-3 py-3"
                  >
                    <Avatar icon={category?.icon} square className="!w-10 !h-10 !text-xl" />
                    <span className="expense-entry-copy min-w-0 flex-1">
                      <span className="expense-entry-title block truncate font-bold">
                        {expense.expenseName}
                      </span>
                      <span className="expense-entry-meta soft-caption block truncate">
                        <span className="expense-entry-category md:hidden">
                          {category?.name ?? "Category"} ·{" "}
                        </span>
                        {payers.join(", ")} paid · {expense.splitType}
                      </span>
                    </span>
                    <span className="expense-entry-amount expense-ledger-amount text-right">
                      <span className="money block font-bold">
                        {formatCurrency(total, group.currency)}
                      </span>
                      <span className="soft-caption block whitespace-nowrap">
                        {formatDisplayDateTime(expense.when)}
                      </span>
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
      )}
    </section>
  );
};

export default ExpenseList;
