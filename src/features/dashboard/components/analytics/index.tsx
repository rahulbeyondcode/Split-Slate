import { ArrowLeft, ChartColumn, Globe2 } from "lucide-react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import { dashboardCategories, dashboardPositions } from "@/features/dashboard/utils/dashboard-data";
import {
  createExpenseFilterDefaults,
  writeExpenseFilterParams,
} from "@/features/expenses/utils/expense-filters";
import { useStore } from "@/shared/configs/store";
import { useViewport } from "@/shared/hooks/use-viewport";
import { categorySpending } from "@/shared/utils/category-spending";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import CategorySpendingList from "@/shared/ui/category-spending-list";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const Analytics = () => {
  const state = useStore();
  const navigate = useNavigate();
  const { isMobile } = useViewport();
  const { groupId } = useParams();
  const groupContext = useOutletContext<GroupDetailContext | undefined>();
  const currency = groupId
    ? (groupContext?.group.currency ?? null)
    : dashboardPositions(state).currency;
  const categories = groupId
    ? groupContext
      ? categorySpending(groupContext.groupExpenses, groupContext.groupCategories)
      : []
    : currency
      ? dashboardCategories(state, currency)
      : [];
  const totalAmount = categories.reduce((sum, item) => sum + item.amount, 0);
  const categoryEntries = categories.map((item) => {
    const categoryIds =
      groupContext?.groupCategories
        .filter((category) => category.name === item.name)
        .map((category) => category.id) ?? [];
    return {
      ...item,
      to:
        groupId && categoryIds.length
          ? `/groups/${groupId}/expenses?${writeExpenseFilterParams({
              ...createExpenseFilterDefaults(),
              categoryIds,
            }).toString()}`
          : undefined,
    };
  });
  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(groupId ? `/groups/${groupId}` : "/dashboard");
    }
  };
  return (
    <div
      className={
        groupId
          ? "page-narrow mobile-sticky-page mx-auto w-full"
          : "page page-narrow mobile-sticky-page dashboard-detail-page"
      }
    >
      <header className={groupId ? "mb-5" : "mb-0"}>
        <button
          type="button"
          onClick={handleBack}
          className={groupId ? "page-back-link" : "page-back-link mb-3"}
        >
          <Icon icon={ArrowLeft} size={18} /> Back
        </button>
        {!groupId && (
          <h1 className="page-title">{isMobile ? "Spending by category" : "Analytics"}</h1>
        )}
        {groupId && (
          <p className="soft-caption mt-4">
            Spending by category · {groupContext?.group.name ?? "this group"} · all time
          </p>
        )}
      </header>
      {!groupId && (
        <p className="soft-caption mb-5">
          {isMobile
            ? "Every category across your groups, all time"
            : "Spending by category · all groups · all time"}
        </p>
      )}
      {!currency ? (
        <EmptyState
          icon={Globe2}
          title="Multiple currencies in use"
          description="Open a group to see spending in its own currency. Different currencies cannot be combined honestly."
        />
      ) : categories.length ? (
        <Surface className="category-spending-card surface-pad">
          <div className="category-spending-summary">
            <div className="min-w-0">
              <p className="money category-spending-total">{formatCurrency(totalAmount, currency)}</p>
              <p className="soft-caption">total recorded spend</p>
            </div>
            <div className="min-w-0">
              <p className="soft-caption">Largest category</p>
              <p className="category-spending-top-name" title={categories[0].name}>
                {categories[0].name}
              </p>
            </div>
          </div>
          <CategorySpendingList
            categories={categoryEntries}
            currency={currency}
            totalAmount={totalAmount}
          />
        </Surface>
      ) : (
        <EmptyState
          icon={ChartColumn}
          title="Nothing to chart yet"
          description="Categories will appear once you record expenses."
        />
      )}
    </div>
  );
};

export default Analytics;
