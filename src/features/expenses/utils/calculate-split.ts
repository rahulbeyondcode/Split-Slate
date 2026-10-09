import { parseMoney } from "@/shared/utils/money";

import type { CalculatedSplit, SplitParticipant } from "@/features/expenses/types/expenses.types";
import type { Expense, Transaction } from "@/shared/types/domain.types";

// Ratios allow six decimal places; scale them before doing any accounting arithmetic.
const parseRatio = (text: string, splitType: "shares" | "percentage"): bigint => {
  const value = text.trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(value)) {
    throw new Error(splitType === "shares" ? "Enter a valid share" : "Enter a valid percentage");
  }
  const [whole, fraction = ""] = value.split(".");
  const ratio = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
  if (ratio <= 0n || ratio > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      splitType === "shares"
        ? "Shares must be positive and within range"
        : "Percentages must be positive and at most 100%",
    );
  }
  return ratio;
};

const PERCENT_SCALE = 1_000_000n;
const FULL_PERCENT = 100n * PERCENT_SCALE;

export const percentageText = (ratio: bigint): string => {
  const whole = ratio / PERCENT_SCALE;
  const fraction = (ratio % PERCENT_SCALE).toString().padStart(6, "0").replace(/0+$/u, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
};

export const resolvePercentageParticipants = (
  participants: SplitParticipant[],
): SplitParticipant[] => {
  const entered = participants.map((member) => {
    const text = member.value.trim();
    if (!text) return null;
    if (!/^\d+(?:\.\d{1,6})?$/u.test(text)) throw new Error("Enter a valid percentage");
    const [whole, fraction = ""] = text.split(".");
    const ratio = BigInt(whole) * PERCENT_SCALE + BigInt(fraction.padEnd(6, "0"));
    if (ratio === 0n) throw new Error("Percentages must be positive");
    return ratio;
  });
  const assigned = entered.reduce<bigint>((sum, value) => sum + (value ?? 0n), 0n);
  const blanks = participants
    .map((member, index) => ({ memberId: member.memberId, index }))
    .filter(({ index }) => entered[index] === null)
    .sort((a, b) => a.memberId.localeCompare(b.memberId));
  if (assigned > FULL_PERCENT || (!blanks.length && assigned !== FULL_PERCENT)) {
    throw new Error("Percentages must add up to 100%");
  }
  const remaining = FULL_PERCENT - assigned;
  const perBlank = blanks.length ? remaining / BigInt(blanks.length) : 0n;
  const extra = blanks.length ? Number(remaining % BigInt(blanks.length)) : 0;
  const suggested = new Map(
    blanks.map(({ index }, position) => [index, perBlank + (position < extra ? 1n : 0n)]),
  );
  return participants.map((member, index) => {
    const ratio = entered[index] ?? suggested.get(index) ?? 0n;
    return {
      ...member,
      value: entered[index] === null ? percentageText(ratio) : member.value.trim(),
    };
  });
};

const allocate = (ids: string[], numerators: bigint[], denominator: bigint): Transaction[] => {
  if (numerators.some((value) => value < 0n))
    throw new Error("An adjustment makes a member's share negative");
  const rows = ids.map((memberId, index) => ({
    memberId,
    amount: numerators[index] / denominator,
    remainder: numerators[index] % denominator,
  }));
  const total = numerators.reduce((sum, value) => sum + value, 0n) / denominator;
  const remaining = Number(total - rows.reduce((sum, row) => sum + row.amount, 0n));
  const ranked = rows
    .slice()
    .sort((a, b) =>
      a.remainder === b.remainder
        ? a.memberId < b.memberId
          ? -1
          : a.memberId > b.memberId
            ? 1
            : 0
        : a.remainder > b.remainder
          ? -1
          : 1,
    );
  for (let i = 0; i < remaining; i++) ranked[i].amount += 1n;
  return rows.map(({ memberId, amount }) => ({ memberId, amount: Number(amount) }));
};

export const calculateSplit = (
  total: number,
  splitType: Expense["splitType"],
  participants: SplitParticipant[],
  currency: string,
): CalculatedSplit => {
  if (!Number.isSafeInteger(total) || total <= 0)
    throw new Error("Total must be a positive safe integer");
  const ids = participants.map((member) => member.memberId);
  if (!ids.length || ids.some((id) => !id.trim()) || new Set(ids).size !== ids.length) {
    throw new Error("Select at least one member, without duplicates");
  }
  const amount = BigInt(total);
  const count = BigInt(ids.length);
  if (splitType === "equal") {
    return {
      owes: allocate(
        ids,
        ids.map(() => amount),
        count,
      ),
      splitMeta: [],
    };
  }
  if (splitType === "amount") {
    const entered = participants.map((member) =>
      member.value.trim() === "" ? null : parseMoney(member.value, currency),
    );
    const assigned = entered.reduce<bigint>((sum, value) => sum + BigInt(value ?? 0), 0n);
    const blanks = ids.filter((_, index) => entered[index] === null);
    if (assigned > amount || (!blanks.length && assigned !== amount)) {
      throw new Error("Split amounts must add up to the total");
    }
    const remainder = blanks.length
      ? allocate(
          blanks,
          blanks.map(() => amount - assigned),
          BigInt(blanks.length),
        )
      : [];
    return {
      owes: ids.map((memberId, index) => ({
        memberId,
        amount: entered[index] ?? remainder.find((row) => row.memberId === memberId)!.amount,
      })),
      splitMeta: [],
    };
  }
  if (splitType === "shares" || splitType === "percentage") {
    const weighted =
      splitType === "percentage"
        ? resolvePercentageParticipants(participants).filter((member) => member.value !== "0")
        : participants;
    const weightedIds = weighted.map((member) => member.memberId);
    const ratios = weighted.map((member) => parseRatio(member.value, splitType));
    const sum = ratios.reduce((acc, value) => acc + value, 0n);
    if (splitType === "percentage" && sum !== FULL_PERCENT)
      throw new Error("Percentages must add up to 100%");
    return {
      owes: allocate(
        weightedIds,
        ratios.map((ratio) => amount * ratio),
        sum,
      ),
      splitMeta: weighted.map((member) => ({
        memberId: member.memberId,
        // Keep the exact input for editing; converting large ratios to Number loses digits.
        value: member.value.trim(),
      })),
    };
  }
  if (splitType === "adjustment") {
    const adjustments = participants.map((member) =>
      parseMoney(member.value.trim() || "0", currency, true),
    );
    const base = amount - adjustments.reduce((sum, value) => sum + BigInt(value), 0n);
    return {
      owes: allocate(
        ids,
        adjustments.map((value) => base + BigInt(value) * count),
        count,
      ),
      splitMeta: ids.map((memberId, index) => ({ memberId, value: adjustments[index] })),
    };
  }
  throw new Error("Unsupported split type");
};
