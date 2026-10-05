import { makeActivityEvent } from "@/features/activity/utils/activity-events";

import type { AppStore } from "@/shared/configs/store/types";
import type { ActivityEvent } from "@/shared/types/domain.types";

export const activityFeed = (state: AppStore, groupId?: string): ActivityEvent[] => {
  const recorded = new Set(
    state.activityEvents
      .filter((event) => event.kind === "expense" && event.action === "created")
      .map((event) => event.subjectId),
  );
  // Pre-log expenses and imported expenses have no event. Display them without altering the DB.
  const older = state.expenses
    .filter((expense) => !recorded.has(expense.expenseId))
    .map((expense) => {
      const group = state.groups.find((item) => item.id === expense.groupId);
      const category = state.categories.find((item) => item.id === expense.categoryId);
      const payer = state.members.find(
        (item) => item.id === expense.transactions.paid[0]?.memberId,
      );
      const person = state.people.find((item) => item.id === payer?.personId);
      const event = makeActivityEvent({
        group,
        kind: "expense",
        action: "created",
        label: `${person?.id === state.localUser?.id ? "You" : (person?.name ?? "Someone")} paid ${expense.expenseName}`,
        subjectId: expense.expenseId,
        icon: category?.icon ?? group?.icon,
        amount: expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
        createdAt: expense.createdAt,
      });
      return { ...event, id: `older-${expense.expenseId}`, groupId: expense.groupId };
    });
  return [...state.activityEvents, ...older]
    .filter((event) => !groupId || event.groupId === groupId)
    .map((event, index) => ({ event, index }))
    .sort((a, b) => b.event.createdAt - a.event.createdAt || b.index - a.index)
    .map(({ event }) => event);
};
