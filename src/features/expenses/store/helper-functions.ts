import { v4 as uuid } from "uuid";

import { localDateTime } from "@/features/expenses/utils/expense-form-values";
import { createExpenseSchema, expenseTransactions } from "@/features/expenses/utils/expense-schema";
import { rankPayers } from "@/features/expenses/utils/paid-by";
import { db } from "@/shared/configs/db";

import type { CreateExpenseInput } from "@/features/expenses/types/expenses.types";
import type { Expense } from "@/shared/types/domain.types";

// Called inside the expense write transaction; all checks use persisted records.
export const prepareExpense = async (input: CreateExpenseInput, existing?: Expense) => {
  const values = createExpenseSchema(input.currency).parse(input.values);
  const calculated = expenseTransactions(values, input.currency);
  const group = await db.groups.get(input.groupId);
  if (!group) throw new Error("Group not found");
  if (group.currency !== input.currency)
    throw new Error("Group currency changed. Reopen the expense form.");
  const members = await db.members.where("groupId").equals(group.id).toArray();
  const people = await db.people.toArray();
  const localUser = await db.localUser.toCollection().first();
  const creatorId =
    existing?.createdBy ?? members.find((member) => member.personId === localUser?.id)?.id;
  if (!creatorId) throw new Error("Your membership could not be found");
  const validMembers = new Set(
    members
      .filter((member) => people.some((person) => person.id === member.personId))
      .map((member) => member.id),
  );
  const referencedMembers = [
    creatorId,
    ...calculated.transactions.paid.map((row) => row.memberId),
    ...calculated.transactions.owes.map((row) => row.memberId),
  ];
  if (referencedMembers.some((id) => !validMembers.has(id)))
    throw new Error("Every payer and participant must belong to this group");
  const category = await db.categories.get(values.categoryId);
  if (
    !category ||
    category.groupId !== group.id ||
    (!category.isActive && category.id !== existing?.categoryId)
  )
    throw new Error("Choose an active category from this group");
  const tags = await db.tags.bulkGet(values.tagIds);
  if (tags.some((tag) => !tag || tag.groupId !== group.id))
    throw new Error("Choose tags from this group");
  const expense: Expense = {
    expenseId: existing?.expenseId ?? uuid(),
    groupId: group.id,
    expenseName: values.expenseName,
    createdBy: creatorId,
    createdAt: existing?.createdAt ?? Date.now(),
    // A name-only edit must not truncate an existing timestamp's seconds/milliseconds.
    when:
      existing && localDateTime(existing.when) === values.when
        ? existing.when
        : new Date(values.when).getTime(),
    categoryId: category.id,
    tagIds: values.tagIds,
    attachmentIds: existing?.attachmentIds ?? [],
    splitType: values.splitType,
    ...calculated,
  };
  const previous = await db.expenses.where("groupId").equals(group.id).toArray();
  const next = [...previous.filter((item) => item.expenseId !== expense.expenseId), expense];
  const total = next.reduce(
    (sum, item) =>
      item.transactions.paid.reduce((subtotal, row) => subtotal + BigInt(row.amount), sum),
    0n,
  );
  if (total > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error(
      "This expense would exceed the group's supported total. Use a new group for additional expenses.",
    );
  const frequentPayerIds = rankPayers(
    members.map((member) => ({
      id: member.id,
      name: people.find((person) => person.id === member.personId)?.name ?? "",
    })),
    next,
  );
  return { expense, frequentPayerIds };
};

export const requireExpense = async (expenseId: string, groupId: string): Promise<Expense> => {
  const expense = await db.expenses.get(expenseId);
  if (!expense || expense.groupId !== groupId) throw new Error("Expense not found in this group");
  return expense;
};

export const remainingPayerRanking = async (
  groupId: string,
  expenseId: string,
): Promise<string[]> => {
  const members = await db.members.where("groupId").equals(groupId).toArray();
  const people = await db.people.toArray();
  const expenses = await db.expenses.where("groupId").equals(groupId).toArray();
  return rankPayers(
    members.map((member) => ({
      id: member.id,
      name: people.find((person) => person.id === member.personId)?.name ?? "",
    })),
    expenses.filter((expense) => expense.expenseId !== expenseId),
  );
};
