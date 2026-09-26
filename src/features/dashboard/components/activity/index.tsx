import { Link } from "react-router-dom";

import { dashboardActivity } from "@/features/dashboard/utils/dashboard-data";
import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";

import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Surface from "@/shared/ui/surface";

interface PropsType {
  compact?: boolean;
  groupId?: string;
}

const Activity = ({ compact = false, groupId }: PropsType) => {
  const state = useStore();
  const entries = dashboardActivity(state, groupId);
  return (
    <div className={compact ? "" : "page page-narrow"}>
      <header className="mb-5">
        <h1 className={compact ? "section-title" : "page-title"}>Activity</h1>
        {!compact && <p className="soft-caption mt-1">Expenses recorded across your groups</p>}
      </header>
      {entries.length ? (
        <Surface className={compact ? "border-0 shadow-none" : "surface-pad"}>
          {entries.map(({ expense, group, icon, title, amount }) => (
            <Link
              key={expense.expenseId}
              className="ui-row"
              to={`/groups/${expense.groupId}/expenses/${expense.expenseId}`}
            >
              <Avatar icon={icon} />
              <span className="flex-1 min-w-0">
                <span className="block truncate text-xs font-bold">{title}</span>
                <span className="soft-caption">
                  {group?.name} ·{" "}
                  {new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(
                    expense.when,
                  )}
                </span>
              </span>
              <span className="money text-xs font-semibold">
                {formatCurrency(amount, group?.currency ?? "INR")}
              </span>
            </Link>
          ))}
        </Surface>
      ) : (
        <EmptyState
          icon="🧾"
          title="No activity yet"
          description="Recorded expenses will appear here."
        />
      )}
    </div>
  );
};

export default Activity;
