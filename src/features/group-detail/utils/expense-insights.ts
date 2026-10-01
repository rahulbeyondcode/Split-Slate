import { calculateBalances, calculateGroupTotal } from "@/shared/utils/balances";

import type { GroupMemberWithPerson } from "@/features/group-detail/types/group-detail.types";
import type { Category, Expense } from "@/shared/types/domain.types";

const safeAmount = (value: bigint): number => {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) throw new Error("Expense insight exceeds the supported range");
  return amount;
};

export const calculateExpenseInsights = (
  expenses: Expense[],
  members: GroupMemberWithPerson[],
  categories: Category[],
) => {
  const total = calculateGroupTotal(expenses);
  const balances = calculateBalances(
    expenses,
    members.map((member) => member.id),
  );
  const paid = new Map(members.map((member) => [member.id, 0n]));
  const owed = new Map(members.map((member) => [member.id, 0n]));
  const categoryTotals = new Map<string, bigint>();

  for (const expense of expenses) {
    let expenseTotal = 0n;
    for (const row of expense.transactions.paid) {
      paid.set(row.memberId, paid.get(row.memberId)! + BigInt(row.amount));
      expenseTotal += BigInt(row.amount);
    }
    for (const row of expense.transactions.owes) {
      owed.set(row.memberId, owed.get(row.memberId)! + BigInt(row.amount));
    }
    categoryTotals.set(
      expense.categoryId,
      (categoryTotals.get(expense.categoryId) ?? 0n) + expenseTotal,
    );
  }

  const topCategory = [...categoryTotals]
    .map(([id, amount]) => ({
      name: categories.find((category) => category.id === id)?.name ?? "Unknown category",
      amount: safeAmount(amount),
      id,
    }))
    .sort(
      (a, b) => b.amount - a.amount || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
    )[0];

  return {
    total,
    average: expenses.length
      ? safeAmount((BigInt(total) + BigInt(expenses.length) / 2n) / BigInt(expenses.length))
      : 0,
    topCategory: topCategory ?? null,
    members: members.map((member) => ({
      memberId: member.id,
      paid: safeAmount(paid.get(member.id)!),
      owed: safeAmount(owed.get(member.id)!),
      net: balances.get(member.id)!,
    })),
  };
};
