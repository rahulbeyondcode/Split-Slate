import { CURRENCIES } from "@/shared/constants/currencies";

// ISO 4217 accounting precision, independent of locale-specific display defaults.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "UYI",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);
const THREE_DECIMAL_CURRENCIES = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

export const currencyDecimals = (currency: string): number => {
  if (!CURRENCIES.some((item) => item.code === currency)) throw new Error("Unsupported currency");
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(currency)) return 3;
  return 2;
};

export const parseMoney = (text: string, currency: string, signed = false): number => {
  const decimals = currencyDecimals(currency);
  const value = text.trim();
  if (!(signed ? /^-?\d+(?:\.\d+)?$/ : /^\d+(?:\.\d+)?$/).test(value)) {
    throw new Error("Enter a valid decimal amount");
  }
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  if (fraction.length > decimals) {
    throw new Error(`${currency} supports ${decimals} decimal places`);
  }
  const magnitude =
    BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0");
  const amount = Number(value.startsWith("-") ? -magnitude : magnitude);
  if (!Number.isSafeInteger(amount)) throw new Error("Amount is too large");
  return amount;
};

export const moneyToDecimal = (amount: number, currency: string): string => {
  if (!Number.isSafeInteger(amount)) throw new Error("Amount must be a safe integer");
  const decimals = currencyDecimals(currency);
  const digits = BigInt(Math.abs(amount))
    .toString()
    .padStart(decimals + 1, "0");
  const magnitude = decimals ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}` : digits;
  return `${amount < 0 ? "-" : ""}${magnitude}`;
};
