import { v4 as uuid } from "uuid";

import { db } from "@/shared/configs/db";

import type { Category } from "@/shared/types/domain.types";

import type { CategoriesSlice, SliceCreator } from "./types";

export const createCategoriesSlice: SliceCreator<CategoriesSlice> = (set, get) => ({
  categories: [],
  masterCategories: [],
  defaultGroupCategories: [],

  addCategory: async (groupId, name, icon) => {
    const category: Category = { id: uuid(), groupId, name, icon, isActive: true };
    await db.categories.add(category);
    set((s) => ({ categories: [...s.categories, category] }));
    return category;
  },

  removeCategory: async (categoryId) => {
    const inUse = get().expenses.some((e) => e.categoryId === categoryId);
    if (inUse) {
      throw new Error("Cannot delete a category used by expenses; reassign those expenses first");
    }
    await db.categories.delete(categoryId);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== categoryId) }));
  },
});
