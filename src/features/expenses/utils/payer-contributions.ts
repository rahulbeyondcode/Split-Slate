import { calculateSplit } from "@/features/expenses/utils/calculate-split";
import { parseMoney } from "@/shared/utils/money";

import type { SplitParticipant } from "@/features/expenses/types/expenses.types";
import type { Transaction } from "@/shared/types/domain.types";

interface PayerPreview {
  paid: Transaction[];
  error: string;
}

export const previewPayerContributions = (
  amount: string,
  payers: SplitParticipant[],
  currency: string,
): PayerPreview => {
  if (!amount.trim() || !payers.length) return { paid: [], error: "" };
  let total: number;
  try {
    total = parseMoney(amount, currency);
    if (total <= 0) return { paid: [], error: "" };
  } catch {
    return { paid: [], error: "" };
  }

  const entered: Transaction[] = [];
  try {
    for (const payer of payers) {
      if (payer.value.trim()) {
        entered.push({ memberId: payer.memberId, amount: parseMoney(payer.value, currency) });
      }
    }
    const assigned = entered.reduce((sum, payer) => sum + BigInt(payer.amount), 0n);
    if (assigned > BigInt(total)) {
      return { paid: entered, error: "Payer amounts exceed the total" };
    }
    return { paid: calculateSplit(total, "amount", payers, currency).owes, error: "" };
  } catch (error) {
    return { paid: entered, error: (error as Error).message };
  }
};
