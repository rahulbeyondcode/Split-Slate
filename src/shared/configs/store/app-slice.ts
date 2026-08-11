import { db } from "@/shared/configs/db";
import { stepAfter } from "@/shared/utils/setup-steps";

import {
  SEED_DEFAULT_GROUP_CATEGORIES,
  SEED_MASTER_CATEGORIES,
} from "@/shared/constants/categories";
import type { SettingsRecord } from "@/shared/types/domain.types";

import type { AppSlice, SliceCreator } from "./types";

// Key-aware wrapper over db.settings.get narrows the union to the row type
// for the given id, so callers don't need to re-check `row.id` after fetching.
const getSetting = <T extends SettingsRecord["id"]>(id: T) =>
  db.settings.get(id) as Promise<Extract<SettingsRecord, { id: T }> | undefined>;

export const createAppSlice: SliceCreator<AppSlice> = (set, get) => ({
  expenses: [],
  initialized: false,

  init: async () => {
    const [
      localUserRows,
      groups,
      allPeople,
      groupMembers,
      categories,
      expenses,
      onboarding,
      categorySettings,
    ] = await Promise.all([
      db.localUser.toArray(),
      db.groups.toArray(),
      db.people.toArray(),
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
      onboardingRow = {
        id: "onboarding",
        lastCompletedStep: null,
        groupId: null,
        complete: false,
      };
      await db.settings.put(onboardingRow);
    }

    set({
      localUser: localUserRows[0] ?? null,
      groups,
      people: allPeople,
      members: groupMembers,
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

  removeTagFromGroupExpenses: async (groupId, tag) => {
    const matchingExpenses = get().expenses.filter(
      (expense) =>
        expense.groupId === groupId &&
        (expense.tags ?? []).some((expenseTag) => expenseTag.trim() === tag),
    );
    const updatedExpenses = matchingExpenses.map((expense) => ({
      ...expense,
      tags: (expense.tags ?? []).filter((expenseTag) => expenseTag.trim() !== tag),
    }));
    if (updatedExpenses.length === 0) return;

    await db.expenses.bulkPut(updatedExpenses);
    const updatedById = new Map(
      updatedExpenses.map((expense) => [expense.expenseId, expense] as const),
    );
    set((s) => ({
      expenses: s.expenses.map((expense) => updatedById.get(expense.expenseId) ?? expense),
    }));
  },
});
