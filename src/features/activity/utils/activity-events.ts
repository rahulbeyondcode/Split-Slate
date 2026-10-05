import { v4 as uuid } from "uuid";

import { db } from "@/shared/configs/db";

import type { ActivityEvent, Group } from "@/shared/types/domain.types";

type EventInput = Pick<ActivityEvent, "kind" | "action" | "label"> & {
  group?: Group;
  icon?: string;
  subjectId?: string;
  amount?: number;
  createdAt?: number;
};

export const makeActivityEvent = ({
  group,
  kind,
  action,
  label,
  icon,
  subjectId,
  amount,
  createdAt,
}: EventInput): ActivityEvent => ({
  id: uuid(),
  groupId: group?.id ?? null,
  groupName: group?.name ?? "Your contacts",
  subjectId: subjectId ?? null,
  kind,
  action,
  label,
  icon: icon ?? group?.icon ?? "✦",
  amount: amount ?? null,
  currency: group?.currency ?? null,
  createdAt: createdAt ?? Date.now(),
});

// Call from the same Dexie transaction as the domain mutation.
export const writeActivity = async (input: EventInput): Promise<ActivityEvent> => {
  const event = makeActivityEvent(input);
  await db.activityEvents.add(event);
  return event;
};
