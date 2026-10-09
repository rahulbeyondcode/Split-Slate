// Round percentage text for presentation only; never use this for allocation or form values.
export const formatPercentageDisplay = (value: string | number): string => {
  const text = String(value).trim();
  const match = /^(\d+)(?:\.(\d+))?$/u.exec(text);
  if (!match) return text;

  const fraction = match[2] ?? "";
  const rounded =
    BigInt(match[1]) * 1000n +
    BigInt(fraction.slice(0, 3).padEnd(3, "0")) +
    (Number(fraction[3] ?? "0") >= 5 ? 1n : 0n);
  const decimals = (rounded % 1000n).toString().padStart(3, "0").replace(/0+$/u, "");
  return `${rounded / 1000n}${decimals ? `.${decimals}` : ""}`;
};
