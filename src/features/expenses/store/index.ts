import { db } from "@/shared/configs/db";
import {
  prepareExpense,
  remainingPayerRanking,
  requireExpense,
} from "@/features/expenses/store/helper-functions";

import type { SliceCreator } from "@/shared/configs/store/types";
import type { ExpensesSlice } from "@/features/expenses/types/expenses.types";

export const createExpensesSlice: SliceCreator<ExpensesSlice> = (set) => ({
  addExpense: async (input) => {
    const result = await db.transaction(
      "rw",
      [db.groups, db.members, db.people, db.localUser, db.categories, db.tags, db.expenses],
      async () => {
        const prepared = await prepareExpense(input);
        await db.expenses.add(prepared.expense);
        await db.groups.update(input.groupId, { frequentPayerIds: prepared.frequentPayerIds });
        return prepared;
      },
    );
    set((state) => ({
      expenses: [...state.expenses, result.expense],
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
      [db.groups, db.members, db.people, db.localUser, db.categories, db.tags, db.expenses],
      async () => {
        const existing = await requireExpense(expenseId, input.groupId);
        const prepared = await prepareExpense(input, existing);
        await db.expenses.put(prepared.expense);
        await db.groups.update(input.groupId, { frequentPayerIds: prepared.frequentPayerIds });
        return prepared;
      },
    );
    set((state) => ({
      expenses: [
        ...state.expenses.filter((expense) => expense.expenseId !== expenseId),
        result.expense,
      ],
      groups: state.groups.map((group) =>
        group.id === input.groupId
          ? { ...group, frequentPayerIds: result.frequentPayerIds }
          : group,
      ),
    }));
    return result.expense;
  },
  removeExpense: async (expenseId, groupId) => {
    const frequentPayerIds = await db.transaction(
      "rw",
      [db.groups, db.members, db.people, db.expenses, db.attachments],
      async () => {
        await requireExpense(expenseId, groupId);
        if (!(await db.groups.get(groupId))) throw new Error("Group not found");
        const ranking = await remainingPayerRanking(groupId, expenseId);
        // The attachment owner index also catches records omitted from attachmentIds.
        await db.attachments.where("expenseId").equals(expenseId).delete();
        await db.expenses.delete(expenseId);
        await db.groups.update(groupId, { frequentPayerIds: ranking });
        return ranking;
      },
    );
    set((state) => ({
      expenses: state.expenses.filter((expense) => expense.expenseId !== expenseId),
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, frequentPayerIds } : group,
      ),
    }));
  },
});
