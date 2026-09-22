import type { SuggestedTransfer } from "@/shared/types/balances.types";
import type { Expense } from "@/shared/types/domain.types";

const safeAmount = (amount: bigint): number => {
  const result = Number(amount);
  if (!Number.isSafeInteger(result)) throw new Error("Balance exceeds the supported range");
  return result;
};

export const calculateMemberNet = (expenses: Expense[], memberId: string): number =>
  safeAmount(
    expenses.reduce((net, expense) => {
      const paid = expense.transactions.paid
        .filter((row) => row.memberId === memberId)
        .reduce((sum, row) => sum + BigInt(row.amount), 0n);
      const owed = expense.transactions.owes
        .filter((row) => row.memberId === memberId)
        .reduce((sum, row) => sum + BigInt(row.amount), 0n);
      return net + paid - owed;
    }, 0n),
  );

export const calculateGroupTotal = (expenses: Expense[]): number =>
  safeAmount(
    expenses.reduce(
      (total, expense) =>
        expense.transactions.paid.reduce((sum, row) => sum + BigInt(row.amount), total),
      0n,
    ),
  );

export const calculateBalances = (
  expenses: Expense[],
  memberIds: string[],
): Map<string, number> => {
  const balances = new Map(memberIds.map((id) => [id, 0n]));
  for (const expense of expenses) {
    for (const [rows, sign] of [
      [expense.transactions.paid, 1n],
      [expense.transactions.owes, -1n],
    ] as const) {
      for (const row of rows) {
        if (!balances.has(row.memberId)) throw new Error("An expense references a missing member");
        if (!Number.isSafeInteger(row.amount) || row.amount < 0)
          throw new Error("Invalid expense amount");
        balances.set(row.memberId, balances.get(row.memberId)! + sign * BigInt(row.amount));
      }
    }
  }
  return new Map([...balances].map(([id, amount]) => [id, safeAmount(amount)]));
};

// Re-match the largest remaining balances each time; this is not guaranteed to minimize transfers.
export const suggestTransfers = (balances: Map<string, number>): SuggestedTransfer[] => {
  let total = 0n;
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];
  for (const [id, amount] of balances) {
    if (!Number.isSafeInteger(amount)) throw new Error("Invalid member balance");
    total += BigInt(amount);
    if (amount > 0) creditors.push({ id, amount });
    if (amount < 0) debtors.push({ id, amount: -amount });
  }
  if (total !== 0n) throw new Error("Member balances must add up to zero");
  const compare = (a: { id: string; amount: number }, b: { id: string; amount: number }) =>
    b.amount - a.amount || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const transfers: SuggestedTransfer[] = [];
  while (creditors.length && debtors.length) {
    creditors.sort(compare);
    debtors.sort(compare);
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.amount, debtor.amount);
    transfers.push({ fromMemberId: debtor.id, toMemberId: creditor.id, amount });
    creditor.amount -= amount;
    debtor.amount -= amount;
    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }
  return transfers;
};
