import type { Settlement } from "@/shared/types/domain.types";

export type SettlementInput = Pick<
  Settlement,
  "groupId" | "fromMemberId" | "toMemberId" | "amount" | "when" | "tagIds"
>;

export interface SettlementsSlice {
  addSettlement: (input: SettlementInput) => Promise<Settlement>;
  updateSettlement: (id: string, input: SettlementInput) => Promise<Settlement>;
  removeSettlement: (id: string, groupId: string) => Promise<void>;
}
