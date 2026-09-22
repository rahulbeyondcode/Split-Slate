import { moneyToDecimal } from "@/shared/utils/money";

import type { ExpenseFormValues, PayerMember } from "@/features/expenses/types/expenses.types";
import type { Expense } from "@/shared/types/domain.types";

export const localDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

// Retain the saved transaction order before appending newly added group members.
export const expenseFormMembers = (members: PayerMember[], expense?: Expense): PayerMember[] => {
  if (!expense) return members;
  const ids = [
    ...new Set([
      ...expense.transactions.owes.map((row) => row.memberId),
      ...members.map((member) => member.id),
    ]),
  ];
  return ids.flatMap((id) => members.filter((member) => member.id === id));
};

export const expenseFormValues = (
  expense: Expense,
  members: PayerMember[],
  currency: string,
): ExpenseFormValues => ({
  expenseName: expense.expenseName,
  amount: moneyToDecimal(
    expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
    currency,
  ),
  when: localDateTime(expense.when),
  categoryId: expense.categoryId,
  tagIds: expense.tagIds.slice(),
  payerMode: expense.transactions.paid.length > 1 ? "multiple" : "single",
  payerId: expense.transactions.paid[0]?.memberId ?? "",
  payers: [
    ...expense.transactions.paid.map((row) => ({
      memberId: row.memberId,
      amount: moneyToDecimal(row.amount, currency),
    })),
    ...members
      .filter((member) => !expense.transactions.paid.some((row) => row.memberId === member.id))
      .map((member) => ({ memberId: member.id, amount: "" })),
  ],
  splitType: expense.splitType,
  participants: expenseFormMembers(members, expense).map((member) => {
    const owed = expense.transactions.owes.find((row) => row.memberId === member.id);
    const meta = expense.splitMeta.find((row) => row.memberId === member.id);
    return {
      memberId: member.id,
      selected: !!owed,
      value:
        expense.splitType === "amount" && owed
          ? moneyToDecimal(owed.amount, currency)
          : expense.splitType === "adjustment" && meta
            ? moneyToDecimal(Number(meta.value), currency)
            : meta
              ? String(meta.value)
              : "",
    };
  }),
});
