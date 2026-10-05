import type { Category, Expense } from "@/shared/types/domain.types";

export const categorySpending = (expenses: Expense[], categories: Category[]) => {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const totals = new Map<string, { name: string; icon: string; amount: number }>();
  for (const expense of expenses) {
    const category = categoryById.get(expense.categoryId);
    const name = category?.name ?? "Other";
    const previous = totals.get(name);
    totals.set(name, {
      name,
      icon: category?.icon ?? "✦",
      amount:
        (previous?.amount ?? 0) +
        expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
    });
  }
  return [...totals.values()].sort((a, b) => b.amount - a.amount);
};
