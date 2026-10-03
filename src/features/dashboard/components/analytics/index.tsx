import { ArrowLeft, ChartColumn, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";

import { dashboardCategories, dashboardPositions } from "@/features/dashboard/utils/dashboard-data";
import { useStore } from "@/shared/configs/store";
import { useViewport } from "@/shared/hooks/use-viewport";
import { formatCurrency } from "@/shared/utils/currency";

import EmojiImage from "@/shared/ui/emoji-image";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const Analytics = () => {
  const state = useStore();
  const { isMobile } = useViewport();
  const { currency } = dashboardPositions(state);
  const categories = currency ? dashboardCategories(state, currency) : [];
  const max = categories[0]?.amount || 1;
  return (
    <div className="page page-narrow mobile-sticky-page">
      <header className="mb-5">
        {isMobile && (
          <Link to="/dashboard" className="page-back-link">
            <Icon icon={ArrowLeft} size={18} /> Back to dashboard
          </Link>
        )}
        <h1 className="page-title">{isMobile ? "Spending by category" : "Analytics"}</h1>
        <p className="soft-caption mt-1">
          {isMobile
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
