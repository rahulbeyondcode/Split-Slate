import {
  calculateBalances,
  calculateGroupTotal,
  calculateMemberNet,
  suggestTransfers,
} from "@/shared/utils/balances";
import { categorySpending } from "@/shared/utils/category-spending";

import type { AppStore } from "@/shared/configs/store/types";
import type { Group } from "@/shared/types/domain.types";

export const groupPosition = (state: AppStore, group: Group) => {
  const member = state.members.find(
    (item) => item.groupId === group.id && item.personId === state.localUser?.id,
  );
  const entries = state.expenses.filter((expense) => expense.groupId === group.id);
  const payments = state.settlements.filter((settlement) => settlement.groupId === group.id);
  return member ? calculateMemberNet(entries, member.id, payments) : 0;
};

export const dashboardPositions = (state: AppStore) => {
  const entries = state.groups.map((group) => ({ group, amount: groupPosition(state, group) }));
  const currencies = [...new Set(state.groups.map((group) => group.currency))];
  return {
    entries,
    currency: currencies.length === 1 ? currencies[0] : null,
    get: entries.reduce((sum, entry) => sum + Math.max(0, entry.amount), 0),
    give: entries.reduce((sum, entry) => sum + Math.max(0, -entry.amount), 0),
  };
};

export const dashboardTransfers = (state: AppStore) =>
  state.groups.flatMap((group) => {
    const groupMembers = state.members.filter((member) => member.groupId === group.id);
    const self = groupMembers.find((member) => member.personId === state.localUser?.id);
    if (!self) return [];
    const expenses = state.expenses.filter((expense) => expense.groupId === group.id);
    const payments = state.settlements.filter((settlement) => settlement.groupId === group.id);
    const balances = calculateBalances(
      expenses,
      groupMembers.map((member) => member.id),
      payments,
    );
    return suggestTransfers(balances)
      .filter((transfer) => transfer.fromMemberId === self.id || transfer.toMemberId === self.id)
      .map((transfer) => {
        const incoming = transfer.toMemberId === self.id;
        const otherId = incoming ? transfer.fromMemberId : transfer.toMemberId;
        const person = state.people.find(
          (item) => item.id === groupMembers.find((member) => member.id === otherId)?.personId,
        );
        return {
          group,
          person,
          amount: transfer.amount,
          incoming,
          key: `${group.id}-${transfer.fromMemberId}-${transfer.toMemberId}`,
        };
      });
  });

export const dashboardCategories = (state: AppStore, currency: string) =>
  categorySpending(
    state.expenses.filter(
      (expense) =>
        state.groups.find((group) => group.id === expense.groupId)?.currency === currency,
    ),
    state.categories,
  );

export const groupSpending = (state: AppStore, group: Group) =>
  calculateGroupTotal(state.expenses.filter((expense) => expense.groupId === group.id));
