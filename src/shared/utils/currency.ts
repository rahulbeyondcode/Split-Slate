import { currencyDecimals, moneyToDecimal } from "@/shared/utils/money";

export const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currencyDecimals(currency),
    maximumFractionDigits: currencyDecimals(currency),
  }).format(moneyToDecimal(amount, currency) as unknown as number);
