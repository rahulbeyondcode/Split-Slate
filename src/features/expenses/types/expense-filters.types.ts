import type { z } from "zod";

import type { expenseFilterFieldsSchema } from "@/features/expenses/utils/expense-filters";

export type ExpenseFilterValues = z.infer<typeof expenseFilterFieldsSchema>;
export type ExpenseFilterOptionField =
  | "categoryIds"
  | "tagIds"
  | "payerIds"
  | "memberIds"
  | "splitTypes";
