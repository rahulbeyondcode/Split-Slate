import type { z } from "zod";

import type { expenseFieldsSchema } from "@/features/expenses/utils/expense-schema";

import type { Expense, SplitMeta, Transaction } from "@/shared/types/domain.types";

export type ExpenseFormValues = z.infer<typeof expenseFieldsSchema>;

export interface SplitParticipant {
  memberId: string;
  value: string;
}

export interface CalculatedSplit {
  owes: Transaction[];
  splitMeta: SplitMeta[];
}

export interface CreateExpenseInput {
  groupId: string;
  currency: string;
  values: ExpenseFormValues;
}

export interface ExpensesSlice {
  addExpense: (input: CreateExpenseInput) => Promise<Expense>;
}

export interface PayerMember {
  id: string;
  name: string;
}
