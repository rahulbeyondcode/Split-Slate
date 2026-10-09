import { ReceiptText } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { activityFeed } from "@/features/activity/utils/activity-feed";
import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDisplayDateTime } from "@/shared/utils/date-time";

import type { ActivityEvent } from "@/shared/types/domain.types";

import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Surface from "@/shared/ui/surface";

interface PropsType {
  compact?: boolean;
  groupId?: string;
}

const ActivityFeed = ({ compact = false, groupId }: PropsType) => {
  const { groupId: routeGroupId } = useParams();
  const activeGroupId = groupId ?? routeGroupId;
  const state = useStore();
  const entries = activityFeed(state, activeGroupId);
  const activityRows = entries.map((event: ActivityEvent) => {
    const recordedAt = formatDisplayDateTime(event.createdAt);
    const formattedAmount =
      event.amount !== null && event.currency ? formatCurrency(event.amount, event.currency) : null;
    const title = event.id.startsWith("older-")
      ? event.label
      : `${event.kind[0].toUpperCase()}${event.kind.slice(1)} ${event.action}: ${event.label}`;
    const content = (
      <>
        <Avatar icon={event.icon} square className={compact ? "activity-entry-avatar" : ""} />
        <span className={compact ? "activity-entry-details" : "flex-1 min-w-0"}>
          <span className={compact ? "activity-entry-title" : "block truncate text-xs font-bold"}>
            {title}
          </span>
          {compact ? (
            <span className="soft-caption activity-entry-meta">
              <span className="activity-entry-group">{event.groupName}</span>
              <span className="activity-entry-date">{recordedAt}</span>
            </span>
          ) : (
            <span className="soft-caption">
              {event.groupName} · {recordedAt}
            </span>
          )}
          {compact && formattedAmount && (
            <span className="activity-entry-amount money">{formattedAmount}</span>
          )}
        </span>
        {!compact && formattedAmount && (
          <span className="money text-xs font-semibold">{formattedAmount}</span>
        )}
      </>
    );
    let destination: string | null = null;
    const groupExists = state.groups.some((group) => group.id === event.groupId);
    if (event.action !== "deleted") {
      if (event.kind === "person") destination = "/friends";
      else if (event.groupId && groupExists) {
        const base = `/groups/${event.groupId}`;
        if (event.kind === "category" || event.kind === "tag") destination = `${base}/categories`;
        else if (event.kind === "member") destination = `${base}/members`;
        else if (event.kind === "settlement") destination = `${base}/balances`;
        else if (event.kind === "expense" && event.subjectId) {
          if (state.expenses.some((expense) => expense.expenseId === event.subjectId)) {
            destination = `${base}/expenses/${event.subjectId}`;
          }
        } else destination = base;
      }
    }
    return destination ? (
      <Link key={event.id} className={compact ? "activity-entry" : "ui-row"} to={destination}>
        {content}
      </Link>
    ) : (
      <div key={event.id} className={compact ? "activity-entry" : "ui-row"}>
        {content}
      </div>
    );
  });
  return (
    <div className={compact ? "" : "page page-narrow mobile-sticky-page"}>
      <header className={compact ? "activity-panel-header" : "mb-5"}>
        <h1 className={compact ? "section-title" : "page-title"}>Activity</h1>
        {!compact && (
          <p className="soft-caption mt-1">
            {activeGroupId ? "Recent changes in this group" : "Recent changes across your groups"}
          </p>
        )}
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
          description="Your changes will appear here."
        />
      )}
    </div>
  );
};

export default ActivityFeed;
