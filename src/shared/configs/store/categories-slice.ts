import { v4 as uuid } from "uuid";

import { db } from "@/shared/configs/db";

import type { Category } from "@/shared/types/domain.types";

import type { CategoriesSlice, SliceCreator } from "./types";

export const createCategoriesSlice: SliceCreator<CategoriesSlice> = (set, get) => ({
  categories: [],
  masterCategories: [],
  defaultGroupCategories: [],

  addCategory: async (groupId, name, icon) => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error("Category name is required");
    }
    const duplicate = get().categories.some(
      (category) =>
        category.groupId === groupId &&
        category.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );
    if (duplicate) {
      throw new Error("Category already exists");
    }

    const category: Category = {
      id: uuid(),
      groupId,
      name: normalizedName,
      icon,
      isActive: true,
    };
    await db.categories.add(category);
    set((s) => ({ categories: [...s.categories, category] }));
    return category;
  },

  updateCategory: async (categoryId, patch) => {
    const existing = get().categories.find((category) => category.id === categoryId);
    if (!existing) {
      throw new Error("Category not found");
    }

    const normalizedPatch = {
      ...patch,
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    };
    if (normalizedPatch.name !== undefined && !normalizedPatch.name) {
      throw new Error("Category name is required");
    }
    if (normalizedPatch.name !== undefined) {
      const duplicate = get().categories.some(
        (category) =>
          category.groupId === existing.groupId &&
          category.id !== categoryId &&
          category.name.trim().toLowerCase() === normalizedPatch.name?.toLowerCase(),
      );
      if (duplicate) {
        throw new Error("Category already exists");
      }
    }

    await db.categories.update(categoryId, normalizedPatch);
    const updated: Category = { ...existing, ...normalizedPatch };
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
