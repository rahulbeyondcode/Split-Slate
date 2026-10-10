import { sanitizeDecimalInput } from "@/features/expenses/utils/split-input";

export const sanitizeExpenseAmountInput = (value: string): string => {
  const [whole, fraction] = sanitizeDecimalInput(value).split(".");
  const limitedWhole = whole.slice(0, 8);
  return fraction === undefined ? limitedWhole : `${limitedWhole}.${fraction.slice(0, 2)}`;
};

// Group the raw decimal text without Number conversion, rounding, or currency-specific rules.
export const formatExpenseAmountInput = (value: string): string => {
  const [whole, fraction] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
};
