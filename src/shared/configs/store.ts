import { v4 as uuid } from "uuid";
import { create } from "zustand";

import { db } from "@/shared/configs/db";
import { maxStep, nextStep, stepAfter } from "@/shared/utils/setup-steps";

import {
  SEED_DEFAULT_GROUP_CATEGORIES,
  SEED_MASTER_CATEGORIES,
} from "@/shared/constants/categories";
import type {
  Category,
  Expense,
  Group,
  GroupDraft,
  LocalUser,
  Member,
  OnboardingSettings,
  SettingsRecord,
  SetupStep,
} from "@/shared/types/domain.types";

interface AppStore {
  localUser: LocalUser | null;
  groups: Group[];
  members: Member[];
  categories: Category[];
  expenses: Expense[];
  initialized: boolean;

  masterCategories: { name: string; icon: string }[];
  defaultGroupCategories: string[];

  // Ephemeral, memory-only draft of the in-progress create-group form (powers live preview).
  groupDraft: GroupDraft | null;

  onboardingStep: SetupStep;
  onboardingLastCompletedStep: SetupStep | null;
  onboardingGroupId: string | null;
  onboardingComplete: boolean;

  init: () => Promise<void>;
  setLocalUser: (name: string, icon: string) => Promise<LocalUser>;
  createGroup: (
    name: string,
    icon: string,
    currency: string,
  ) => Promise<{ group: Group; creatorMember: Member }>;
  addMember: (groupId: string, name: string, icon: string) => Promise<Member>;

  updateGroup: (groupId: string, patch: Partial<Group>) => Promise<Group>;
  addCategory: (groupId: string, name: string, icon: string) => Promise<Category>;
  removeCategory: (categoryId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  updateOnboarding: (patch: Partial<Omit<OnboardingSettings, "id">>) => Promise<void>;
  advanceOnboarding: (fromStep: SetupStep) => Promise<void>;
  setOnboardingStep: (step: SetupStep) => void;

  setGroupDraft: (draft: GroupDraft | null) => void;
  clearGroupDraft: () => void;
}

// Key-aware wrapper over db.settings.get — narrows the union to the row type
// for the given id, so callers don't need to re-check `row.id` after fetching.
const getSetting = <T extends SettingsRecord["id"]>(id: T) =>
  db.settings.get(id) as Promise<Extract<SettingsRecord, { id: T }> | undefined>;

export const useStore = create<AppStore>((set, get) => ({
  localUser: null,
  groups: [],
  members: [],
  categories: [],
  expenses: [],
  initialized: false,

  masterCategories: [],
  defaultGroupCategories: [],

  groupDraft: null,

  onboardingStep: "identity",
  onboardingLastCompletedStep: null,
  onboardingGroupId: null,
  onboardingComplete: false,

  init: async () => {
    const [users, groups, members, categories, expenses, onboarding, categorySettings] =
      await Promise.all([
        db.localUser.toArray(),
        db.groups.toArray(),
        db.members.toArray(),
        db.categories.toArray(),
        db.expenses.toArray(),
        getSetting("onboarding"),
        getSetting("categories"),
      ]);

    let categoryRow = categorySettings;
    if (!categoryRow) {
      categoryRow = {
        id: "categories",
        master: SEED_MASTER_CATEGORIES,
        default: SEED_DEFAULT_GROUP_CATEGORIES,
      };
      await db.settings.put(categoryRow);
    }

    let onboardingRow = onboarding;
    if (!onboardingRow) {
      onboardingRow = { id: "onboarding", lastCompletedStep: null, groupId: null, complete: false };
      await db.settings.put(onboardingRow);
    }

    set({
      localUser: users[0] ?? null,
      groups,
      members,
      categories,
      expenses,
      initialized: true,
      masterCategories: categoryRow.master,
      defaultGroupCategories: categoryRow.default,
      onboardingLastCompletedStep: onboardingRow.lastCompletedStep,
      onboardingGroupId: onboardingRow.groupId,
      onboardingComplete: onboardingRow.complete,
      onboardingStep: stepAfter(onboardingRow.lastCompletedStep),
    });
  },

  setLocalUser: async (name, icon) => {
    const existing = get().localUser;
    const user: LocalUser = { id: existing?.id ?? uuid(), name, icon };
    await db.localUser.put(user);
    set({ localUser: user });
    return user;
  },

  createGroup: async (name, icon, currency) => {
    const localUser = get().localUser;
    if (!localUser) throw new Error("localUser must be set before creating a group");

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
      name: localUser.name,
      icon: localUser.icon,
    };

    await db.groups.add(group);
    await db.members.add(creatorMember);
    set((s) => ({ groups: [...s.groups, group], members: [...s.members, creatorMember] }));

    return { group, creatorMember };
  },

  addMember: async (groupId, name, icon) => {
    const member: Member = { id: uuid(), groupId, name, icon };
    await db.members.add(member);
    set((s) => ({ members: [...s.members, member] }));
    return member;
  },

  updateGroup: async (groupId, patch) => {
    await db.groups.update(groupId, patch);
    const existing = get().groups.find((g) => g.id === groupId);
    if (!existing) throw new Error("group not found");
    const updated: Group = { ...existing, ...patch };
    set((s) => ({ groups: s.groups.map((g) => (g.id === groupId ? updated : g)) }));
    return updated;
  },

  addCategory: async (groupId, name, icon) => {
    const category: Category = { id: uuid(), groupId, name, icon, isActive: true };
    await db.categories.add(category);
    set((s) => ({ categories: [...s.categories, category] }));
    return category;
  },

  removeCategory: async (categoryId) => {
    const inUse = get().expenses.some((e) => e.categoryId === categoryId);
    if (inUse)
      throw new Error("Cannot delete a category used by expenses; reassign those expenses first");
    await db.categories.delete(categoryId);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== categoryId) }));
  },

  removeMember: async (memberId) => {
    const inUse = get().expenses.some(
      (e) =>
        e.createdBy === memberId ||
        e.transactions.paid.some((t) => t.memberId === memberId) ||
        e.transactions.owes.some((t) => t.memberId === memberId),
    );
    if (inUse)
      throw new Error("Cannot remove a member assigned to expenses; reassign those expenses first");

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

  updateOnboarding: async (patch) => {
    const { onboardingLastCompletedStep, onboardingGroupId, onboardingComplete } = get();
    const record: OnboardingSettings = {
      id: "onboarding",
      lastCompletedStep: onboardingLastCompletedStep,
      groupId: onboardingGroupId,
      complete: onboardingComplete,
      ...patch,
    };
    await db.settings.put(record);
    set({
      onboardingLastCompletedStep: record.lastCompletedStep,
      onboardingGroupId: record.groupId,
      onboardingComplete: record.complete,
    });
  },

  advanceOnboarding: async (fromStep) => {
    await get().updateOnboarding({
      lastCompletedStep: maxStep(get().onboardingLastCompletedStep, fromStep),
    });
    set({ onboardingStep: nextStep(fromStep) });
  },

  setOnboardingStep: (step) => {
    set({ onboardingStep: step });
  },

  setGroupDraft: (draft) => {
    set({ groupDraft: draft });
  },

  clearGroupDraft: () => {
    set({ groupDraft: null });
  },
}));
