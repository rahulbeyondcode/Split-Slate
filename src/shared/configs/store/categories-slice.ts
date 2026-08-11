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

  updateCategory: async (categoryId, patch) => {
    await db.categories.update(categoryId, patch);
    const existing = get().categories.find((category) => category.id === categoryId);
    if (!existing) {
      throw new Error("category not found");
    }
    const updated: Category = { ...existing, ...patch };
    set((s) => ({
      categories: s.categories.map((category) => (category.id === categoryId ? updated : category)),
    }));
    return updated;
  },

  removeCategory: async (categoryId) => {
    const category = get().categories.find((item) => item.id === categoryId);
    if (!category) {
      throw new Error("category not found");
    }

    const groupCategories = get().categories.filter((item) => item.groupId === category.groupId);
    if (groupCategories.length <= 1) {
      throw new Error("A group needs at least one category");
    }

    const inUse = get().expenses.some((e) => e.categoryId === categoryId);
    if (inUse) {
      throw new Error("Cannot delete a category used by expenses; reassign those expenses first");
    }
    await db.categories.delete(categoryId);
    set((s) => ({ categories: s.categories.filter((c) => c.id !== categoryId) }));
  },
});
