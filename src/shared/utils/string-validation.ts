import { z } from "zod";

export const createRequiredStringSchema = (message: string) => z.string().trim().min(1, message);

export const normalizeRequiredString = (value: string, message: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error(message);
  }
  return normalizedValue;
};
