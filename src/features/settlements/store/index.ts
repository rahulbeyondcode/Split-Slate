import { v4 as uuid } from "uuid";

import { writeActivity } from "@/features/activity/utils/activity-events";
import { db } from "@/shared/configs/db";
import { calculateBalances } from "@/shared/utils/balances";

import type { SliceCreator } from "@/shared/configs/store/types";
import type {
  SettlementInput,
  SettlementsSlice,
} from "@/features/settlements/types/settlements.types";
import type { Settlement } from "@/shared/types/domain.types";

const validateInput = async (input: SettlementInput, existing?: Settlement) => {
  const group = await db.groups.get(input.groupId);
  if (!group) throw new Error("Group not found");
  if (
    !Number.isSafeInteger(input.amount) ||
    input.amount <= 0 ||
    !Number.isSafeInteger(input.when) ||
    input.when < 0
  )
    throw new Error("Enter a valid positive payment and date");
  if (input.fromMemberId === input.toMemberId)
    throw new Error("Choose two different group members");
  if (new Set(input.tagIds).size !== input.tagIds.length)
    throw new Error("Choose each tag only once");

  const members = await db.members.where("groupId").equals(input.groupId).toArray();
  const memberIds = new Set(members.map((member) => member.id));
  if (!memberIds.has(input.fromMemberId) || !memberIds.has(input.toMemberId))
    throw new Error("Choose members from this group");
  const localUser = await db.localUser.toCollection().first();
  const recorder = members.find((member) => member.personId === localUser?.id);
  if (!recorder) throw new Error("You must be a group member to record a payment");
  const tags = await db.tags.bulkGet(input.tagIds);
  if (tags.some((tag) => !tag || tag.groupId !== input.groupId))
    throw new Error("Choose tags from this group");
  const expenses = await db.expenses.where("groupId").equals(input.groupId).toArray();
  const settlements = (
    await db.settlements.where("groupId").equals(input.groupId).toArray()
  ).filter((item) => item.id !== existing?.id);
  const created: Settlement = {
    id: existing?.id ?? uuid(),
    groupId: input.groupId,
    kind: "payment",
    fromMemberId: input.fromMemberId,
    toMemberId: input.toMemberId,
    recordedBy: existing?.recordedBy ?? recorder.id,
    amount: input.amount,
    when: input.when,
    createdAt: existing?.createdAt ?? Date.now(),
    tagIds: [...input.tagIds],
  };
  calculateBalances(expenses, [...memberIds], [...settlements, created]);
  const people = await db.people.bulkGet(
    [created.fromMemberId, created.toMemberId].map(
      (id) => members.find((member) => member.id === id)!.personId,
    ),
  );
  if (people.some((person) => !person)) throw new Error("A member's profile is missing");
  return {
    group,
    settlement: created,
    label: `${people[0]!.name} paid ${people[1]!.name}`,
  };
};

export const createSettlementsSlice: SliceCreator<SettlementsSlice> = (set) => ({
  addSettlement: async (input) => {
    const result = await db.transaction(
      "rw",
      [
        db.groups,
        db.members,
        db.people,
        db.localUser,
        db.tags,
        db.expenses,
        db.settlements,
        db.activityEvents,
      ],
      async () => {
        const prepared = await validateInput(input);
        await db.settlements.add(prepared.settlement);
        const event = await writeActivity({
          group: prepared.group,
          kind: "settlement",
          action: "created",
          label: prepared.label,
          subjectId: prepared.settlement.id,
          amount: prepared.settlement.amount,
        });
        return { ...prepared, event };
      },
    );
    set((state) => ({
      settlements: [...state.settlements, result.settlement],
      activityEvents: [...state.activityEvents, result.event],
    }));
    return result.settlement;
  },
  updateSettlement: async (id, input) => {
    const result = await db.transaction(
      "rw",
      [
        db.groups,
        db.members,
        db.people,
        db.localUser,
        db.tags,
        db.expenses,
        db.settlements,
        db.activityEvents,
      ],
      async () => {
        const existing = await db.settlements.get(id);
        if (!existing || existing.groupId !== input.groupId) throw new Error("Payment not found");
        const prepared = await validateInput(input, existing);
        await db.settlements.put(prepared.settlement);
        const event = await writeActivity({
          group: prepared.group,
          kind: "settlement",
          action: "updated",
          label: prepared.label,
          subjectId: id,
          amount: prepared.settlement.amount,
        });
        return { ...prepared, event };
      },
    );
    set((state) => ({
      settlements: state.settlements.map((item) => (item.id === id ? result.settlement : item)),
      activityEvents: [...state.activityEvents, result.event],
    }));
    return result.settlement;
  },
  removeSettlement: async (id, groupId) => {
    const event = await db.transaction(
      "rw",
      [db.groups, db.members, db.people, db.expenses, db.settlements, db.activityEvents],
      async () => {
        const settlement = await db.settlements.get(id);
        if (!settlement || settlement.groupId !== groupId) throw new Error("Payment not found");
        const group = await db.groups.get(groupId);
        if (!group) throw new Error("Group not found");
        const members = await db.members.bulkGet([settlement.fromMemberId, settlement.toMemberId]);
        const people = await db.people.bulkGet(members.map((member) => member?.personId ?? ""));
        const groupMembers = await db.members.where("groupId").equals(groupId).toArray();
        const expenses = await db.expenses.where("groupId").equals(groupId).toArray();
        const payments = (await db.settlements.where("groupId").equals(groupId).toArray()).filter(
          (item) => item.id !== id,
        );
        calculateBalances(
          expenses,
          groupMembers.map((member) => member.id),
          payments,
        );
        await db.settlements.delete(id);
        return writeActivity({
          group,
          kind: "settlement",
          action: "deleted",
          label: `${people[0]?.name ?? "Member"} paid ${people[1]?.name ?? "Member"}`,
          subjectId: id,
          amount: settlement.amount,
        });
      },
    );
    set((state) => ({
      settlements: state.settlements.filter((item) => item.id !== id),
      activityEvents: [...state.activityEvents, event],
    }));
  },
});
