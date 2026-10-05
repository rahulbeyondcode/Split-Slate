import { writeActivity } from "@/features/activity/utils/activity-events";
import { db } from "@/shared/configs/db";
import {
  prepareExpense,
  remainingPayerRanking,
  requireExpense,
} from "@/features/expenses/store/helper-functions";

import type { SliceCreator } from "@/shared/configs/store/types";
import type { ExpensesSlice } from "@/features/expenses/types/expenses.types";
import type { ActivityEvent, Expense } from "@/shared/types/domain.types";

const recordExpense = async (expense: Expense, action: ActivityEvent["action"]) => {
  const group = await db.groups.get(expense.groupId);
  const category = await db.categories.get(expense.categoryId);
  return writeActivity({
    group,
    kind: "expense",
    action,
    label: expense.expenseName,
    icon: category?.icon ?? group?.icon,
    subjectId: expense.expenseId,
    amount: expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
  });
};

export const createExpensesSlice: SliceCreator<ExpensesSlice> = (set) => ({
  addExpense: async (input) => {
    const result = await db.transaction(
      "rw",
      [
        db.groups,
        db.members,
        db.people,
        db.localUser,
        db.categories,
        db.tags,
        db.expenses,
        db.activityEvents,
      ],
      async () => {
        const prepared = await prepareExpense(input);
        await db.expenses.add(prepared.expense);
        await db.groups.update(input.groupId, { frequentPayerIds: prepared.frequentPayerIds });
        return { ...prepared, event: await recordExpense(prepared.expense, "created") };
      },
    );
    set((state) => ({
      expenses: [...state.expenses, result.expense],
      activityEvents: [...state.activityEvents, result.event],
      groups: state.groups.map((group) =>
        group.id === input.groupId
          ? { ...group, frequentPayerIds: result.frequentPayerIds }
          : group,
      ),
    }));
    return result.expense;
  },
  updateExpense: async (expenseId, input) => {
    const result = await db.transaction(
      "rw",
      [
        db.groups,
        db.members,
        db.people,
        db.localUser,
        db.categories,
        db.tags,
        db.expenses,
        db.activityEvents,
      ],
      async () => {
        const existing = await requireExpense(expenseId, input.groupId);
        const prepared = await prepareExpense(input, existing);
        await db.expenses.put(prepared.expense);
        await db.groups.update(input.groupId, { frequentPayerIds: prepared.frequentPayerIds });
        return { ...prepared, event: await recordExpense(prepared.expense, "updated") };
      },
    );
    set((state) => ({
      expenses: [
        ...state.expenses.filter((expense) => expense.expenseId !== expenseId),
        result.expense,
      ],
      activityEvents: [...state.activityEvents, result.event],
      groups: state.groups.map((group) =>
        group.id === input.groupId
          ? { ...group, frequentPayerIds: result.frequentPayerIds }
          : group,
      ),
    }));
    return result.expense;
  },
  updateExpenseDetails: async (expenseId, groupId, patch) => {
    const result = await db.transaction(
      "rw",
      [db.groups, db.expenses, db.categories, db.tags, db.activityEvents],
      async () => {
        const existing = await requireExpense(expenseId, groupId);
        const changes: { categoryId?: string; tagIds?: string[] } = {};
        if (patch.categoryId !== undefined) {
          const category = await db.categories.get(patch.categoryId);
          if (
            !category ||
            category.groupId !== groupId ||
            (!category.isActive && category.id !== existing.categoryId)
          )
            throw new Error("Choose an active category from this group");
          changes.categoryId = category.id;
        }
        if (patch.tagIds !== undefined) {
          if (new Set(patch.tagIds).size !== patch.tagIds.length) throw new Error("Duplicate tag");
          const tags = await db.tags.bulkGet(patch.tagIds);
          if (tags.some((tag) => !tag || tag.groupId !== groupId))
            throw new Error("Choose tags from this group");
          changes.tagIds = patch.tagIds.slice();
        }
        if (!Object.keys(changes).length) return { updated: existing, event: null };
        await db.expenses.update(expenseId, changes);
        const updated = { ...existing, ...changes };
        return { updated, event: await recordExpense(updated, "updated") };
      },
    );
    set((state) => ({
      expenses: state.expenses.map((expense) =>
        expense.expenseId === expenseId ? result.updated : expense,
      ),
      activityEvents: result.event ? [...state.activityEvents, result.event] : state.activityEvents,
    }));
    return result.updated;
  },
  removeExpense: async (expenseId, groupId) => {
    const result = await db.transaction(
      "rw",
      [
        db.groups,
        db.members,
        db.people,
        db.categories,
        db.expenses,
        db.attachments,
        db.activityEvents,
      ],
      async () => {
        const expense = await requireExpense(expenseId, groupId);
        if (!(await db.groups.get(groupId))) throw new Error("Group not found");
        const ranking = await remainingPayerRanking(groupId, expenseId);
        // The attachment owner index also catches records omitted from attachmentIds.
        await db.attachments.where("expenseId").equals(expenseId).delete();
        await db.expenses.delete(expenseId);
        await db.groups.update(groupId, { frequentPayerIds: ranking });
        return { frequentPayerIds: ranking, event: await recordExpense(expense, "deleted") };
      },
    );
    set((state) => ({
      expenses: state.expenses.filter((expense) => expense.expenseId !== expenseId),
      activityEvents: [...state.activityEvents, result.event],
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, frequentPayerIds: result.frequentPayerIds } : group,
      ),
    }));
  },
});
