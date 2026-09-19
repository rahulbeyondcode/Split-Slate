import { v4 as uuid } from "uuid";

import { db } from "@/shared/configs/db";
import { normalizeRequiredString } from "@/shared/utils/string-validation";

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
    const normalizedName = normalizeRequiredString(name, "Group name is required");
    const normalizedIcon = normalizeRequiredString(icon, "Group icon is required");
    const normalizedCurrency = normalizeRequiredString(currency, "Currency is required");

    const group: Group = {
      id: groupId,
      name: normalizedName,
      icon: normalizedIcon,
      currency: normalizedCurrency,
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
    const normalizedPatch: Partial<Group> = {
      ...patch,
      ...(patch.name !== undefined
        ? { name: normalizeRequiredString(patch.name, "Group name is required") }
        : {}),
      ...(patch.icon !== undefined
        ? { icon: normalizeRequiredString(patch.icon, "Group icon is required") }
        : {}),
      ...(patch.currency !== undefined
        ? { currency: normalizeRequiredString(patch.currency, "Currency is required") }
        : {}),
    };
    await db.groups.update(groupId, normalizedPatch);
    const existing = get().groups.find((g) => g.id === groupId);
    if (!existing) {
      throw new Error("group not found");
    }
    const updated: Group = { ...existing, ...normalizedPatch };
    set((s) => ({ groups: s.groups.map((g) => (g.id === groupId ? updated : g)) }));
    return updated;
  },

  addMember: async (groupId, personId) => {
    const member = await db.transaction("rw", db.members, async () => {
      const existing = await db.members
        .where("groupId")
        .equals(groupId)
        .and((item) => item.personId === personId)
        .first();
      if (existing) {
        throw new Error("This person is already a member of the group");
      }

      const created: Member = { id: uuid(), groupId, personId };
      await db.members.add(created);
      return created;
    });
    set((s) => ({ members: [...s.members, member] }));
    return member;
  },

  removeMember: async (memberId) => {
    const member = get().members.find((item) => item.id === memberId);
    if (!member) {
      throw new Error("Member not found");
    }
    if (member.personId === get().localUser?.id) {
      throw new Error("You cannot remove yourself from a group you created");
    }

    const inUse = get().expenses.some(
      (e) =>
        e.createdBy === memberId ||
        e.transactions.paid.some((t) => t.memberId === memberId) ||
        e.transactions.owes.some((t) => t.memberId === memberId),
    );
    if (inUse) {
      throw new Error("Cannot remove a member assigned to expenses; reassign those expenses first");
    }

    await db.members.delete(memberId);
    set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));

    const group = get().groups.find((g) => g.id === member.groupId);
    if (group && group.frequentPayerIds.includes(memberId)) {
      const frequentPayerIds = group.frequentPayerIds.filter((id) => id !== memberId);
      await db.groups.update(group.id, { frequentPayerIds });
      set((s) => ({
        groups: s.groups.map((g) => (g.id === group.id ? { ...g, frequentPayerIds } : g)),
      }));
    }
  },
});
