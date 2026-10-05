import { v4 as uuid } from "uuid";

import { writeActivity } from "@/features/activity/utils/activity-events";
import { db } from "@/shared/configs/db";
import { normalizeRequiredString } from "@/shared/utils/string-validation";

import type { Category } from "@/shared/types/domain.types";

import type { CategoriesSlice, SliceCreator } from "./types";

export const createCategoriesSlice: SliceCreator<CategoriesSlice> = (set, get) => ({
  categories: [],
  masterCategories: [],
  defaultGroupCategories: [],

  addCategory: async (groupId, name, icon) => {
    const normalizedName = normalizeRequiredString(name, "Category name is required");
    const normalizedIcon = normalizeRequiredString(icon, "Category icon is required");
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
      icon: normalizedIcon,
      isActive: true,
    };
    const event = await db.transaction("rw", db.categories, db.activityEvents, async () => {
      await db.categories.add(category);
      return writeActivity({
        group: get().groups.find((item) => item.id === groupId),
        kind: "category",
        action: "created",
        label: category.name,
        icon: category.icon,
        subjectId: category.id,
      });
    });
    set((s) => ({
      categories: [...s.categories, category],
      activityEvents: [...s.activityEvents, event],
    }));
    return category;
  },

  updateCategory: async (categoryId, patch) => {
    const existing = get().categories.find((category) => category.id === categoryId);
    if (!existing) {
      throw new Error("Category not found");
    }

    const normalizedPatch = {
      ...patch,
      ...(patch.name !== undefined
        ? { name: normalizeRequiredString(patch.name, "Category name is required") }
        : {}),
      ...(patch.icon !== undefined
        ? { icon: normalizeRequiredString(patch.icon, "Category icon is required") }
        : {}),
    };
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

    const updated: Category = { ...existing, ...normalizedPatch };
    const event = await db.transaction("rw", db.categories, db.activityEvents, async () => {
      if (!(await db.categories.update(categoryId, normalizedPatch)))
        throw new Error("Category not found");
      return writeActivity({
        group: get().groups.find((item) => item.id === existing.groupId),
        kind: "category",
        action: "updated",
        label: updated.name,
        icon: updated.icon,
        subjectId: categoryId,
      });
    });
    set((s) => ({
      categories: s.categories.map((category) => (category.id === categoryId ? updated : category)),
      activityEvents: [...s.activityEvents, event],
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
    const event = await db.transaction("rw", db.categories, db.activityEvents, async () => {
      if (!(await db.categories.get(categoryId))) throw new Error("Category not found");
      await db.categories.delete(categoryId);
      return writeActivity({
        group: get().groups.find((item) => item.id === category.groupId),
        kind: "category",
        action: "deleted",
        label: category.name,
        icon: category.icon,
        subjectId: categoryId,
      });
    });
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== categoryId),
      activityEvents: [...s.activityEvents, event],
    }));
  },
});
