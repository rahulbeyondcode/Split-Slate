import { calculateSplit, percentageText } from "@/features/expenses/utils/calculate-split";
import { parseMoney } from "@/shared/utils/money";

import type { SplitParticipant } from "@/features/expenses/types/expenses.types";
import type { Expense, Transaction } from "@/shared/types/domain.types";

export const sanitizeDecimalInput = (value: string, allowNegative = false): string => {
  const sign = allowNegative && value.trimStart().startsWith("-") ? "-" : "";
  const [whole, ...fractions] = value.replace(/[^\d.]/gu, "").split(".");
  return sign + whole + (fractions.length ? `.${fractions.join("")}` : "");
};

export const sanitizeSplitInput = (value: string, splitType: Expense["splitType"]): string =>
  sanitizeDecimalInput(value, splitType === "adjustment");

export const capPercentageInput = (value: string, others: SplitParticipant[]): string => {
  const cleaned = sanitizeDecimalInput(value);
  if (!cleaned || cleaned === ".") return cleaned;
  const used = others.reduce((sum, member) => {
    const text = member.value.trim();
    if (!/^\d+(?:\.\d{1,6})?$/u.test(text)) return sum;
    const [whole, fraction = ""] = text.split(".");
    return sum + BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
  }, 0n);
  const available = used >= 100_000_000n ? 0n : 100_000_000n - used;
  const [whole, fraction = ""] = cleaned.split(".");
  const decimals = Math.max(6, fraction.length);
  const scale = 10n ** BigInt(decimals);
  const entered = BigInt(whole || "0") * scale + BigInt(fraction.padEnd(decimals, "0") || "0");
  return entered > available * (scale / 1_000_000n) ? percentageText(available) : cleaned;
};

// Show the parts already entered while keeping the save-time split validation unchanged.
export const previewIncompleteSplit = (
  total: number,
  splitType: Expense["splitType"],
  participants: SplitParticipant[],
  currency: string,
): Transaction[] => {
  if (splitType === "amount") {
    return participants.map(({ memberId, value }) => {
      let amount = 0;
      try {
        if (value.trim()) amount = parseMoney(value, currency);
      } catch {
        // An invalid in-progress value has no calculated allocation.
      }
      return { memberId, amount };
    });
  }
  const valid = participants.filter(({ value }) => {
    const text = value.trim();
    if (!/^\d+(?:\.\d{1,6})?$/u.test(text)) return false;
    const [whole, fraction = ""] = text.split(".");
    const ratio = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
    return ratio > 0n && ratio <= BigInt(Number.MAX_SAFE_INTEGER);
  });
  if (splitType === "shares") {
    try {
      return valid.length ? calculateSplit(total, "shares", valid, currency).owes : [];
    } catch {
      return [];
    }
  }
  if (splitType === "percentage") {
    return valid.flatMap(({ memberId, value }) => {
      const [whole, fraction = ""] = value.trim().split(".");
      const ratio = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
      if (ratio > 100_000_000n) return [];
      return [{ memberId, amount: Number((BigInt(total) * ratio + 50_000_000n) / 100_000_000n) }];
    });
  }
  return [];
};
