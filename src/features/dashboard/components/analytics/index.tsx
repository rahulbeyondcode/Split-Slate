import { dashboardCategories, dashboardPositions } from "@/features/dashboard/utils/dashboard-data";
import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";

import EmptyState from "@/shared/ui/empty-state";
import Surface from "@/shared/ui/surface";

const Analytics = () => {
  const state = useStore();
  const { currency } = dashboardPositions(state);
  const categories = currency ? dashboardCategories(state, currency) : [];
  const max = categories[0]?.amount || 1;
  return (
    <div className="page page-narrow">
      <header className="mb-5">
        <h1 className="page-title">Analytics</h1>
        <p className="soft-caption mt-1">Spending by category · all groups · all time</p>
      </header>
      {!currency ? (
        <EmptyState
          icon="🌍"
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
              <span className="text-xl w-8">{item.icon}</span>
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
          icon="📊"
          title="Nothing to chart yet"
          description="Categories will appear once you record expenses."
        />
      )}
    </div>
  );
};

export default Analytics;
