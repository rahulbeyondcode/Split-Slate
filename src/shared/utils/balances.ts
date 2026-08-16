import type { Expense } from "@/shared/types/domain.types";

export const calculateMemberNet = (expenses: Expense[], memberId: string) =>
  expenses.reduce((net, expense) => {
    const paid = expense.transactions.paid
      .filter((transaction) => transaction.memberId === memberId)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const owed = expense.transactions.owes
      .filter((transaction) => transaction.memberId === memberId)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return net + paid - owed;
  }, 0);

export const calculateGroupTotal = (expenses: Expense[]) =>
  expenses.reduce(
    (total, expense) =>
      total + expense.transactions.paid.reduce((sum, transaction) => sum + transaction.amount, 0),
    0,
  );
