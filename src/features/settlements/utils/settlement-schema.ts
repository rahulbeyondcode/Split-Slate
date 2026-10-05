import { z } from "zod";

import { parseMoney } from "@/shared/utils/money";

export const createSettlementSchema = (currency: string) =>
  z
    .object({
      fromMemberId: z.string().min(1, "Choose who paid"),
      toMemberId: z.string().min(1, "Choose who received the payment"),
      amount: z.string().refine((value) => {
        try {
          return parseMoney(value, currency) > 0;
        } catch {
          return false;
        }
      }, "Enter a positive amount with at most two decimal places"),
      when: z.string().refine((value) => {
        const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
        if (!match) return false;
        const date = new Date(value);
        return (
          Number.isFinite(date.getTime()) &&
          date.getFullYear() === Number(match[1]) &&
          date.getMonth() + 1 === Number(match[2]) &&
          date.getDate() === Number(match[3]) &&
          date.getHours() === Number(match[4]) &&
          date.getMinutes() === Number(match[5])
        );
      }, "Enter a valid local date and time"),
      tagIds: z.array(z.string()),
    })
    .refine((value) => value.fromMemberId !== value.toMemberId, {
      path: ["toMemberId"],
      message: "Choose a different recipient",
    });

export type SettlementFormValues = z.infer<ReturnType<typeof createSettlementSchema>>;
