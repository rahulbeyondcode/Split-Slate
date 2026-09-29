import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import {
  createExpenseFilterSchema,
  readExpenseFilterParams,
} from "@/features/expenses/utils/expense-filters";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";

interface PropsType {
  currency: string;
  children: ReactNode;
}

const ExpenseFilterProvider = ({ currency, children }: PropsType) => {
  const [searchParams] = useSearchParams();
  const methods = useForm<ExpenseFilterValues>({
    defaultValues: readExpenseFilterParams(searchParams),
    values: readExpenseFilterParams(searchParams),
    resolver: zodResolver(createExpenseFilterSchema(currency)),
    mode: "onChange",
  });
  const { trigger } = methods;
  useEffect(() => {
    void trigger();
  }, [searchParams, trigger]);
  return <FormProvider {...methods}>{children}</FormProvider>;
};

export default ExpenseFilterProvider;
