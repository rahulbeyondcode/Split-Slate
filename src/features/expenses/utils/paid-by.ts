import type { PayerMember } from "@/features/expenses/types/expenses.types";
import type { Expense } from "@/shared/types/domain.types";

export const rankPayers = (members: PayerMember[], expenses: Expense[]): string[] => {
  const counts = new Map<string, number>();
  for (const expense of expenses) {
    for (const id of new Set(
      expense.transactions.paid.filter((row) => row.amount > 0).map((row) => row.memberId),
    )) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return members
    .slice()
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) ||
        a.name.localeCompare(b.name, "en") ||
        a.id.localeCompare(b.id, "en"),
    )
    .slice(0, 5)
    .map((member) => member.id);
};

export const defaultPayer = (
  members: PayerMember[],
  expenses: Expense[],
  creatorId: string,
): string => {
  const latest = expenses
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt || b.expenseId.localeCompare(a.expenseId))[0];
  const recent = latest?.transactions.paid.find(
    (payer) => payer.amount > 0 && members.some((member) => member.id === payer.memberId),
  );
  return (
    recent?.memberId ??
    members.find((member) => member.id === creatorId)?.id ??
    members[0]?.id ??
    ""
  );
};
