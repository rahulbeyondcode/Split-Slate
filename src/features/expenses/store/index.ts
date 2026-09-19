import { v4 as uuid } from "uuid";

import { createExpenseSchema, expenseTransactions } from "@/features/expenses/utils/expense-schema";
import { rankPayers } from "@/features/expenses/utils/paid-by";
import { db } from "@/shared/configs/db";

import type { SliceCreator } from "@/shared/configs/store/types";
import type { ExpensesSlice } from "@/features/expenses/types/expenses.types";
import type { Expense } from "@/shared/types/domain.types";

export const createExpensesSlice: SliceCreator<ExpensesSlice> = (set) => ({
  addExpense: async (input) => {
    const values = createExpenseSchema(input.currency).parse(input.values);
    const calculated = expenseTransactions(values, input.currency);
    const result = await db.transaction(
      "rw",
      [db.groups, db.members, db.people, db.localUser, db.categories, db.tags, db.expenses],
      async () => {
        const group = await db.groups.get(input.groupId);
        if (!group) throw new Error("Group not found");
        if (group.currency !== input.currency)
          throw new Error("Group currency changed. Reopen the expense form.");
        const members = await db.members.where("groupId").equals(group.id).toArray();
        const people = await db.people.toArray();
        const localUser = await db.localUser.toCollection().first();
        const creator = members.find((member) => member.personId === localUser?.id);
        if (!creator) throw new Error("Your membership could not be found");
        const validMembers = new Set(
          members
            .filter((member) => people.some((person) => person.id === member.personId))
            .map((member) => member.id),
        );
        const referencedMembers = [
          creator.id,
          ...calculated.transactions.paid.map((row) => row.memberId),
          ...calculated.transactions.owes.map((row) => row.memberId),
        ];
        if (referencedMembers.some((id) => !validMembers.has(id)))
          throw new Error("Every payer and participant must belong to this group");
        const category = await db.categories.get(values.categoryId);
        if (!category || category.groupId !== group.id || !category.isActive)
          throw new Error("Choose an active category from this group");
        const tags = await db.tags.bulkGet(values.tagIds);
        if (tags.some((tag) => !tag || tag.groupId !== group.id))
          throw new Error("Choose tags from this group");
        const expense: Expense = {
          expenseId: uuid(),
          groupId: group.id,
          expenseName: values.expenseName,
          createdBy: creator.id,
          createdAt: Date.now(),
          when: new Date(values.when).getTime(),
          categoryId: category.id,
          tagIds: values.tagIds,
          attachmentIds: [],
          splitType: values.splitType,
          ...calculated,
        };
        const previous = await db.expenses.where("groupId").equals(group.id).toArray();
        // Bound total spending so every derived group/member amount stays a safe integer.
        const groupTotal = [...previous, expense].reduce(
          (total, item) =>
            item.transactions.paid.reduce((sum, row) => sum + BigInt(row.amount), total),
          0n,
        );
        if (groupTotal > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error(
            "This expense would exceed the group's supported total. Use a new group for additional expenses.",
          );
        }
        const frequentPayerIds = rankPayers(
          members.map((member) => ({
            id: member.id,
            name: people.find((person) => person.id === member.personId)?.name ?? "",
          })),
          [...previous, expense],
        );
        await db.expenses.add(expense);
        await db.groups.update(group.id, { frequentPayerIds });
        return { expense, frequentPayerIds };
      },
    );
    set((state) => ({
      expenses: [...state.expenses, result.expense],
      groups: state.groups.map((group) =>
        group.id === result.expense.groupId
          ? { ...group, frequentPayerIds: result.frequentPayerIds }
          : group,
      ),
    }));
    return result.expense;
  },
});
