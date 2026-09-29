import { ReceiptText } from "lucide-react";
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
  const activityRows = entries.map(({ expense, group, icon, title, amount }) => (
    <Link
      key={expense.expenseId}
      className={compact ? "activity-entry" : "ui-row"}
      to={`/groups/${expense.groupId}/expenses/${expense.expenseId}`}
    >
      <Avatar icon={icon} className={compact ? "activity-entry-avatar" : ""} />
      <span className={compact ? "activity-entry-details" : "flex-1 min-w-0"}>
        <span className={compact ? "activity-entry-title" : "block truncate text-xs font-bold"}>
          {title}
        </span>
        <span className={compact ? "soft-caption activity-entry-meta" : "soft-caption"}>
          {group?.name} ·{" "}
          {new Intl.DateTimeFormat(undefined, {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          }).format(expense.createdAt)}
        </span>
        {compact && (
          <span className="activity-entry-amount money">
            {formatCurrency(amount, group?.currency ?? "INR")}
          </span>
        )}
      </span>
      {!compact && (
        <span className="money text-xs font-semibold">
          {formatCurrency(amount, group?.currency ?? "INR")}
        </span>
      )}
    </Link>
  ));
  return (
    <div className={compact ? "" : "page page-narrow"}>
      <header className={compact ? "activity-panel-header" : "mb-5"}>
        <h1 className={compact ? "section-title" : "page-title"}>Activity</h1>
        {!compact && <p className="soft-caption mt-1">Expenses recorded across your groups</p>}
      </header>
      {entries.length ? (
        compact ? (
          <div className="activity-panel-list">{activityRows}</div>
        ) : (
          <Surface className="surface-pad">{activityRows}</Surface>
        )
      ) : (
        <EmptyState
          icon={ReceiptText}
          title="No activity yet"
          description="Recorded expenses will appear here."
        />
      )}
    </div>
  );
};

export default Activity;
