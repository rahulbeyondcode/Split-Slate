import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  createExpenseFilterDefaults,
  createExpenseFilterSchema,
} from "@/features/expenses/utils/expense-filters";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";

interface PropsType {
  currency: string;
  children: ReactNode;
}

const ExpenseFilterProvider = ({ currency, children }: PropsType) => {
  const methods = useForm<ExpenseFilterValues>({
    defaultValues: createExpenseFilterDefaults(),
    resolver: zodResolver(createExpenseFilterSchema(currency)),
    mode: "onChange",
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

export default ExpenseFilterProvider;
