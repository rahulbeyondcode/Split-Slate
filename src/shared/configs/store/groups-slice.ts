import { v4 as uuid } from "uuid";

import { db } from "@/shared/configs/db";

import type { Group, Member } from "@/shared/types/domain.types";

import type { GroupsSlice, SliceCreator } from "./types";

export const createGroupsSlice: SliceCreator<GroupsSlice> = (set, get) => ({
  groups: [],
  members: [],

  createGroup: async (name, icon, currency) => {
    const localUser = get().localUser;
    if (!localUser) {
      throw new Error("localUser must be set before creating a group");
    }

    const groupId = uuid();
    const memberId = uuid();

    const group: Group = {
      id: groupId,
      name,
      icon,
      currency,
      createdAt: Date.now(),
      frequentPayerIds: [memberId],
    };
    const creatorMember: Member = {
      id: memberId,
      groupId,
      personId: localUser.id,
    };

    await db.groups.add(group);
    await db.members.add(creatorMember);
    set((s) => ({ groups: [...s.groups, group], members: [...s.members, creatorMember] }));

    return { group, creatorMember };
  },

  updateGroup: async (groupId, patch) => {
    await db.groups.update(groupId, patch);
    const existing = get().groups.find((g) => g.id === groupId);
    if (!existing) {
      throw new Error("group not found");
    }
    const updated: Group = { ...existing, ...patch };
    set((s) => ({ groups: s.groups.map((g) => (g.id === groupId ? updated : g)) }));
    return updated;
  },

  addMember: async (groupId, personId) => {
    const member: Member = { id: uuid(), groupId, personId };
    await db.members.add(member);
    set((s) => ({ members: [...s.members, member] }));
    return member;
  },

  removeMember: async (memberId) => {
    const inUse = get().expenses.some(
      (e) =>
        e.createdBy === memberId ||
        e.transactions.paid.some((t) => t.memberId === memberId) ||
        e.transactions.owes.some((t) => t.memberId === memberId),
    );
    if (inUse) {
      throw new Error("Cannot remove a member assigned to expenses; reassign those expenses first");
    }

    const member = get().members.find((m) => m.id === memberId);
    await db.members.delete(memberId);
    set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));

    if (member) {
      const group = get().groups.find((g) => g.id === member.groupId);
      if (group && group.frequentPayerIds.includes(memberId)) {
        const frequentPayerIds = group.frequentPayerIds.filter((id) => id !== memberId);
        await db.groups.update(group.id, { frequentPayerIds });
        set((s) => ({
          groups: s.groups.map((g) => (g.id === group.id ? { ...g, frequentPayerIds } : g)),
        }));
      }
    }
  },
});
