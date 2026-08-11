export const formatMoney = (currency: string, amount: number) =>
  `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
