import { currencyDecimals, moneyToDecimal } from "@/shared/utils/money";

export const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    // Do not let locale or ISO defaults change the app's fixed-hundredths scale.
    minimumFractionDigits: currencyDecimals(currency),
    maximumFractionDigits: currencyDecimals(currency),
  }).format(moneyToDecimal(amount, currency) as unknown as number);
