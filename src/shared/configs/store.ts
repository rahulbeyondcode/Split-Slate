import { v4 as uuid } from "uuid";
import { create } from "zustand";

import { db } from "@/shared/configs/db";
import { maxStep, nextStep, stepAfter } from "@/shared/utils/setup-steps";

import type {
  Category,
  Expense,
  Group,
  LocalUser,
  Member,
  OnboardingProgress,
  SetupStep,
} from "@/shared/types/domain.types";

interface AppStore {
  localUser: LocalUser | null;
  groups: Group[];
  members: Member[];
  categories: Category[];
  expenses: Expense[];
  initialized: boolean;

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
  addCategories: (groupId: string, names: string[]) => Promise<Category[]>;

  updateGroup: (groupId: string, patch: Partial<Group>) => Promise<Group>;
  addCategory: (groupId: string, name: string) => Promise<Category>;
  removeCategory: (categoryId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  updateOnboarding: (patch: Partial<Omit<OnboardingProgress, "id">>) => Promise<void>;
  advanceOnboarding: (fromStep: SetupStep) => Promise<void>;
  setOnboardingStep: (step: SetupStep) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  localUser: null,
  groups: [],
  members: [],
  categories: [],
  expenses: [],
  initialized: false,

  onboardingStep: "identity",
  onboardingLastCompletedStep: null,
  onboardingGroupId: null,
  onboardingComplete: false,

  init: async () => {
    const [users, groups, members, categories, expenses, onboarding] = await Promise.all([
      db.localUser.toArray(),
      db.groups.toArray(),
      db.members.toArray(),
      db.categories.toArray(),
      db.expenses.toArray(),
      db.onboarding.get("current"),
    ]);
    set({
      localUser: users[0] ?? null,
      groups,
      members,
      categories,
      expenses,
      initialized: true,
      onboardingLastCompletedStep: onboarding?.lastCompletedStep ?? null,
      onboardingGroupId: onboarding?.groupId ?? null,
      onboardingComplete: onboarding?.complete ?? false,
      onboardingStep: stepAfter(onboarding?.lastCompletedStep ?? null),
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

  addCategories: async (groupId, names) => {
    const cats: Category[] = names.map((name) => ({ id: uuid(), groupId, name, isActive: true }));
    await db.categories.bulkAdd(cats);
    set((s) => ({ categories: [...s.categories, ...cats] }));
    return cats;
  },

  updateGroup: async (groupId, patch) => {
    await db.groups.update(groupId, patch);
    const existing = get().groups.find((g) => g.id === groupId);
    if (!existing) throw new Error("group not found");
    const updated: Group = { ...existing, ...patch };
    set((s) => ({ groups: s.groups.map((g) => (g.id === groupId ? updated : g)) }));
    return updated;
  },

  addCategory: async (groupId, name) => {
    const category: Category = { id: uuid(), groupId, name, isActive: true };
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
    const record: OnboardingProgress = {
      id: "current",
      lastCompletedStep: onboardingLastCompletedStep,
      groupId: onboardingGroupId,
      complete: onboardingComplete,
      ...patch,
    };
    await db.onboarding.put(record);
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
}));
