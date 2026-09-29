import type { GroupMemberWithPerson } from "@/features/group-detail/types/group-detail.types";
import type { Expense } from "@/shared/types/domain.types";

export const overviewMembers = (
  members: GroupMemberWithPerson[],
  expenses: Expense[],
): GroupMemberWithPerson[] => {
  const paymentCounts = new Map<string, number>();
  for (const expense of expenses) {
    const payers = new Set(
      expense.transactions.paid.filter((row) => row.amount > 0).map((row) => row.memberId),
    );
    for (const id of payers) paymentCounts.set(id, (paymentCounts.get(id) ?? 0) + 1);
  }

  return members
    .slice()
    .sort(
      (a, b) =>
        (paymentCounts.get(b.id) ?? 0) - (paymentCounts.get(a.id) ?? 0) ||
        (a.person?.name ?? "Unknown person").localeCompare(
          b.person?.name ?? "Unknown person",
          "en",
        ) ||
        a.id.localeCompare(b.id, "en"),
    )
    .slice(0, 6);
};
