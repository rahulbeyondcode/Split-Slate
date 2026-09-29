import {
  calculateBalances,
  calculateGroupTotal,
  calculateMemberNet,
  suggestTransfers,
} from "@/shared/utils/balances";

import type { AppStore } from "@/shared/configs/store/types";
import type { Expense, Group } from "@/shared/types/domain.types";

export const groupPosition = (state: AppStore, group: Group) => {
  const member = state.members.find(
    (item) => item.groupId === group.id && item.personId === state.localUser?.id,
  );
  const entries = state.expenses.filter((expense) => expense.groupId === group.id);
  return member ? calculateMemberNet(entries, member.id) : 0;
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
    const balances = calculateBalances(
      expenses,
      groupMembers.map((member) => member.id),
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

export const dashboardActivity = (state: AppStore, groupId?: string) =>
  state.expenses
    .filter((expense) => !groupId || expense.groupId === groupId)
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt || a.expenseId.localeCompare(b.expenseId))
    .map((expense: Expense) => {
      const group = state.groups.find((item) => item.id === expense.groupId);
      const category = state.categories.find((item) => item.id === expense.categoryId);
      const payer = expense.transactions.paid[0];
      const member = state.members.find((item) => item.id === payer?.memberId);
      const person = state.people.find((item) => item.id === member?.personId);
      return {
        expense,
        group,
        icon: category?.icon ?? group?.icon ?? "✦",
        title: `${person?.id === state.localUser?.id ? "You" : (person?.name ?? "Someone")} paid ${expense.expenseName}`,
        amount: expense.transactions.paid.reduce((total, row) => total + row.amount, 0),
      };
    });

export const dashboardCategories = (state: AppStore, currency: string) => {
  const totals = new Map<string, { name: string; icon: string; amount: number }>();
  for (const expense of state.expenses) {
    if (state.groups.find((group) => group.id === expense.groupId)?.currency !== currency) continue;
    const category = state.categories.find((item) => item.id === expense.categoryId);
    const key = category?.name ?? "Other";
    const previous = totals.get(key);
    totals.set(key, {
      name: key,
      icon: category?.icon ?? "✦",
      amount:
        (previous?.amount ?? 0) +
        expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
    });
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount);
};

export const groupSpending = (state: AppStore, group: Group) =>
  calculateGroupTotal(state.expenses.filter((expense) => expense.groupId === group.id));
