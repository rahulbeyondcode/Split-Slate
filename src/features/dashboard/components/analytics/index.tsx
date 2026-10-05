import { ArrowLeft, ChartColumn, Globe2 } from "lucide-react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";

import { dashboardCategories, dashboardPositions } from "@/features/dashboard/utils/dashboard-data";
import { useStore } from "@/shared/configs/store";
import { useViewport } from "@/shared/hooks/use-viewport";
import { categorySpending } from "@/shared/utils/category-spending";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import EmojiImage from "@/shared/ui/emoji-image";
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
  const max = categories[0]?.amount || 1;
  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(`/groups/${groupId}`);
    }
  };
  return (
    <div
      className={
        groupId
          ? "page-narrow mobile-sticky-page mx-auto w-full"
          : "page page-narrow mobile-sticky-page"
      }
    >
      <header className="mb-5">
        {groupId ? (
          <button type="button" onClick={handleBack} className="page-back-link">
            <Icon icon={ArrowLeft} size={18} /> Back
          </button>
        ) : (
          isMobile && (
            <Link to="/dashboard" className="page-back-link dashboard-back-link">
              <Icon icon={ArrowLeft} size={18} /> Back to dashboard
            </Link>
          )
        )}
        {!groupId && (
          <h1 className="page-title">{isMobile ? "Spending by category" : "Analytics"}</h1>
        )}
        <p className={groupId ? "soft-caption mt-4" : "soft-caption mt-1"}>
          {groupId
            ? `Spending by category · ${groupContext?.group.name ?? "this group"} · all time`
            : isMobile
              ? "Every category across your groups, all time"
              : "Spending by category · all groups · all time"}
        </p>
      </header>
      {!currency ? (
        <EmptyState
          icon={Globe2}
          title="Multiple currencies in use"
          description="Open a group to see spending in its own currency. Different currencies cannot be combined honestly."
        />
      ) : categories.length ? (
        <Surface className="surface-pad">
          <p className="money text-3xl font-extrabold">
            {formatCurrency(
              categories.reduce((sum, item) => sum + item.amount, 0),
              currency,
            )}
          </p>
          <p className="soft-caption mb-4">total recorded spend</p>
          {categories.map((item) => (
            <div key={item.name} className="ui-row">
              <EmojiImage icon={item.icon} />
              <span className="w-28 font-semibold">{item.name}</span>
              <span className="h-2 flex-1 rounded-full bg-[var(--surface-soft)]">
                <span
                  className="block h-full rounded-full bg-[var(--brand)]"
                  style={{ width: `${(item.amount / max) * 100}%` }}
                />
              </span>
              <span className="money text-xs">{formatCurrency(item.amount, currency)}</span>
            </div>
          ))}
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
