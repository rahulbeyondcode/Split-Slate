import { v4 as uuid } from "uuid";

import { writeActivity } from "@/features/activity/utils/activity-events";
import { db } from "@/shared/configs/db";
import { normalizeRequiredString } from "@/shared/utils/string-validation";

import type { Group, Member, OnboardingSettings } from "@/shared/types/domain.types";

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

    const event = await db.transaction("rw", db.groups, db.members, db.activityEvents, async () => {
      await db.groups.add(group);
      await db.members.add(creatorMember);
      return writeActivity({
        group,
        kind: "group",
        action: "created",
        label: group.name,
        subjectId: group.id,
      });
    });
    set((s) => ({
      groups: [...s.groups, group],
      members: [...s.members, creatorMember],
      activityEvents: [...s.activityEvents, event],
    }));

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
    const existing = get().groups.find((g) => g.id === groupId);
    if (!existing) {
      throw new Error("group not found");
    }
    const updated: Group = { ...existing, ...normalizedPatch };
    const event = await db.transaction("rw", db.groups, db.activityEvents, async () => {
      if (!(await db.groups.update(groupId, normalizedPatch))) throw new Error("Group not found");
      return writeActivity({
        group: updated,
        kind: "group",
        action: "updated",
        label: updated.name,
        subjectId: groupId,
      });
    });
    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId ? updated : g)),
      activityEvents: [...s.activityEvents, event],
    }));
    return updated;
  },

  removeGroup: async (groupId) => {
    const result = await db.transaction(
      "rw",
      [
        db.groups,
        db.members,
        db.categories,
        db.tags,
        db.expenses,
        db.attachments,
        db.settings,
        db.activityEvents,
      ],
      async () => {
        const group = await db.groups.get(groupId);
        if (!group) throw new Error("Group not found");

        const expenses = await db.expenses.where("groupId").equals(groupId).toArray();
        const expenseIds = expenses.map((expense) => expense.expenseId);
        if (expenseIds.length) await db.attachments.where("expenseId").anyOf(expenseIds).delete();
        await db.expenses.where("groupId").equals(groupId).delete();
        await db.members.where("groupId").equals(groupId).delete();
        await db.categories.where("groupId").equals(groupId).delete();
        await db.tags.where("groupId").equals(groupId).delete();
        await db.groups.delete(groupId);

        const event = await writeActivity({
          group,
          kind: "group",
          action: "deleted",
          label: group.name,
          subjectId: groupId,
        });
        const onboarding = await db.settings.get("onboarding");
        if (onboarding?.id !== "onboarding" || onboarding.groupId !== groupId)
          return { event, nextOnboardingGroupId: undefined };
        const remaining = await db.groups.toArray();
        const nextGroupId =
          remaining.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id))[0]?.id ??
          null;
        const nextOnboarding: OnboardingSettings = { ...onboarding, groupId: nextGroupId };
        await db.settings.put(nextOnboarding);
        return { event, nextOnboardingGroupId: nextGroupId };
      },
    );

    set((state) => ({
      groups: state.groups.filter((group) => group.id !== groupId),
      members: state.members.filter((member) => member.groupId !== groupId),
      categories: state.categories.filter((category) => category.groupId !== groupId),
      tags: state.tags.filter((tag) => tag.groupId !== groupId),
      expenses: state.expenses.filter((expense) => expense.groupId !== groupId),
      activityEvents: [...state.activityEvents, result.event],
      ...(result.nextOnboardingGroupId !== undefined
        ? { onboardingGroupId: result.nextOnboardingGroupId }
        : {}),
    }));
  },

  addMember: async (groupId, personId) => {
    const result = await db.transaction(
      "rw",
      [db.members, db.groups, db.people, db.activityEvents],
      async () => {
        const group = await db.groups.get(groupId);
        if (!group) throw new Error("Group not found");
        const person = await db.people.get(personId);
        if (!person) throw new Error("Person not found");
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
        const event = await writeActivity({
          group,
          kind: "member",
          action: "created",
          label: person.name,
          icon: person.icon,
          subjectId: created.id,
        });
        return { member: created, event };
      },
    );
    set((s) => ({
      members: [...s.members, result.member],
      activityEvents: [...s.activityEvents, result.event],
    }));
    return result.member;
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

    const group = get().groups.find((g) => g.id === member.groupId);
    const person = get().people.find((item) => item.id === member.personId);
    const event = await db.transaction("rw", db.members, db.groups, db.activityEvents, async () => {
      if (!(await db.members.get(memberId))) throw new Error("Member not found");
      await db.members.delete(memberId);
      if (group?.frequentPayerIds.includes(memberId)) {
        await db.groups.update(group.id, {
          frequentPayerIds: group.frequentPayerIds.filter((id) => id !== memberId),
        });
      }
      return writeActivity({
        group,
        kind: "member",
        action: "deleted",
        label: person?.name ?? "Member",
        icon: person?.icon,
        subjectId: memberId,
      });
    });
    set((s) => ({
      members: s.members.filter((m) => m.id !== memberId),
      groups: s.groups.map((g) =>
        g.id === group?.id
          ? { ...g, frequentPayerIds: g.frequentPayerIds.filter((id) => id !== memberId) }
          : g,
      ),
      activityEvents: [...s.activityEvents, event],
    }));
  },
});
