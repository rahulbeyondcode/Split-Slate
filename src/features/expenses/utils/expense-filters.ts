import { z } from "zod";

import { parseMoney } from "@/shared/utils/money";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";
import type { Expense } from "@/shared/types/domain.types";

export const SPLIT_FILTER_OPTIONS = [
  { value: "equal", label: "Equal" },
  { value: "amount", label: "Amount" },
  { value: "shares", label: "Shares" },
  { value: "percentage", label: "Percentage" },
  { value: "adjustment", label: "Adjustment" },
] as const;

export const expenseFilterFieldsSchema = z.object({
  name: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  categoryIds: z.array(z.string()),
  tagIds: z.array(z.string()),
  payerIds: z.array(z.string()),
  memberIds: z.array(z.string()),
  splitTypes: z.array(z.enum(["equal", "amount", "shares", "percentage", "adjustment"])),
  minAmount: z.string(),
  maxAmount: z.string(),
});

export const createExpenseFilterDefaults = (): ExpenseFilterValues => ({
  name: "",
  dateFrom: "",
  dateTo: "",
  categoryIds: [],
  tagIds: [],
  payerIds: [],
  memberIds: [],
  splitTypes: [],
  minAmount: "",
  maxAmount: "",
});

const isCalendarDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    year > 0 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const createExpenseFilterSchema = (currency: string) =>
  expenseFilterFieldsSchema.superRefine((values, context) => {
    for (const field of ["dateFrom", "dateTo"] as const) {
      if (values[field] && !isCalendarDate(values[field])) {
        context.addIssue({ code: "custom", path: [field], message: "Enter a valid calendar date" });
      }
    }
    if (
      isCalendarDate(values.dateFrom) &&
      isCalendarDate(values.dateTo) &&
      values.dateFrom > values.dateTo
    ) {
      context.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "End date must be on or after start date",
      });
    }
    const amounts: Partial<Record<"minAmount" | "maxAmount", number>> = {};
    for (const field of ["minAmount", "maxAmount"] as const) {
      if (!values[field].trim()) continue;
      try {
        amounts[field] = parseMoney(values[field], currency);
      } catch (error) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: error instanceof Error ? error.message : "Enter a valid amount",
        });
      }
    }
    if (
      amounts.minAmount !== undefined &&
      amounts.maxAmount !== undefined &&
      amounts.minAmount > amounts.maxAmount
    ) {
      context.addIssue({
        code: "custom",
        path: ["maxAmount"],
        message: "Maximum must be at least the minimum",
      });
    }
  });

export const countActiveExpenseFilters = (values: ExpenseFilterValues): number =>
  [
    values.name.trim(),
    values.dateFrom || values.dateTo,
    values.categoryIds.length,
    values.tagIds.length,
    values.payerIds.length,
    values.memberIds.length,
    values.splitTypes.length,
    values.minAmount.trim() || values.maxAmount.trim(),
  ].filter(Boolean).length;

type AvailableExpenseFilterOptions = Pick<
  ExpenseFilterValues,
  "categoryIds" | "tagIds" | "payerIds" | "memberIds"
>;

export const pruneUnavailableExpenseFilterOptions = (
  values: ExpenseFilterValues,
  available: AvailableExpenseFilterOptions,
): ExpenseFilterValues => {
  const categoryIds = new Set(available.categoryIds);
  const tagIds = new Set(available.tagIds);
  const payerIds = new Set(available.payerIds);
  const memberIds = new Set(available.memberIds);

  return {
    ...values,
    categoryIds: values.categoryIds.filter((id) => categoryIds.has(id)),
    tagIds: values.tagIds.filter((id) => tagIds.has(id)),
    payerIds: values.payerIds.filter((id) => payerIds.has(id)),
    memberIds: values.memberIds.filter((id) => memberIds.has(id)),
  };
};

// Call with schema-validated values. Calendar strings compare local days without assuming
// that every day is 24 hours or parsing a date-only input as UTC.
export const filterExpenses = (
  expenses: Expense[],
  values: ExpenseFilterValues,
  currency: string,
): Expense[] => {
  const name = values.name.trim().toLowerCase();
  const minimum = values.minAmount.trim() ? parseMoney(values.minAmount, currency) : undefined;
  const maximum = values.maxAmount.trim() ? parseMoney(values.maxAmount, currency) : undefined;
  return expenses.filter((expense) => {
    const date = new Date(expense.when);
    const day = `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const total = expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0);
    return (
      expense.expenseName.toLowerCase().includes(name) &&
      (!values.dateFrom || day >= values.dateFrom) &&
      (!values.dateTo || day <= values.dateTo) &&
      (!values.categoryIds.length || values.categoryIds.includes(expense.categoryId)) &&
      (!values.tagIds.length || expense.tagIds.some((id) => values.tagIds.includes(id))) &&
      (!values.payerIds.length ||
        expense.transactions.paid.some((row) => values.payerIds.includes(row.memberId))) &&
      (!values.memberIds.length ||
        [...expense.transactions.paid, ...expense.transactions.owes].some((row) =>
          values.memberIds.includes(row.memberId),
        )) &&
      (!values.splitTypes.length || values.splitTypes.includes(expense.splitType)) &&
      (minimum === undefined || total >= minimum) &&
      (maximum === undefined || total <= maximum)
    );
  });
};
