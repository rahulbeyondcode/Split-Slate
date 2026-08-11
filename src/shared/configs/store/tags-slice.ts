import { v4 as uuid } from "uuid";

import { db } from "@/shared/configs/db";

import type { Tag } from "@/shared/types/domain.types";

import type { SliceCreator, TagsSlice } from "./types";

const normalizeTagName = (name: string) => name.trim();
const normalizeTagColor = (color: string) => color.trim().toLowerCase();
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/;

export const createTagsSlice: SliceCreator<TagsSlice> = (set, get) => ({
  tags: [],

  addTag: async (groupId, name, color) => {
    const normalizedName = normalizeTagName(name);
    const normalizedColor = normalizeTagColor(color);
    if (!normalizedName) {
      throw new Error("Tag name is required");
    }
    if (!HEX_COLOR_PATTERN.test(normalizedColor)) {
      throw new Error("Tag color must be a valid hex color");
    }
    const duplicate = get().tags.some(
      (tag) => tag.groupId === groupId && tag.name.toLowerCase() === normalizedName.toLowerCase(),
    );
    if (duplicate) {
      throw new Error("Tag already exists");
    }

    const tag: Tag = {
      id: uuid(),
      groupId,
      name: normalizedName,
      color: normalizedColor,
    };
    await db.tags.add(tag);
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  updateTag: async (tagId, patch) => {
    const existing = get().tags.find((tag) => tag.id === tagId);
    if (!existing) {
      throw new Error("Tag not found");
    }

    const normalizedName = patch.name === undefined ? undefined : normalizeTagName(patch.name);
    const normalizedColor = patch.color === undefined ? undefined : normalizeTagColor(patch.color);
    if (normalizedName !== undefined && !normalizedName) {
      throw new Error("Tag name is required");
    }
    if (normalizedName !== undefined) {
      const duplicate = get().tags.some(
        (tag) =>
          tag.groupId === existing.groupId &&
          tag.id !== tagId &&
          tag.name.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (duplicate) {
        throw new Error("Tag already exists");
      }
    }
    if (normalizedColor !== undefined && !HEX_COLOR_PATTERN.test(normalizedColor)) {
      throw new Error("Tag color must be a valid hex color");
    }

    const normalizedPatch = {
      ...patch,
      ...(normalizedName !== undefined ? { name: normalizedName } : {}),
      ...(normalizedColor !== undefined ? { color: normalizedColor } : {}),
    };
    await db.tags.update(tagId, normalizedPatch);
    const updated: Tag = { ...existing, ...normalizedPatch };
    set((state) => ({
      tags: state.tags.map((tag) => (tag.id === tagId ? updated : tag)),
    }));
    return updated;
  },

  removeTag: async (tagId) => {
    const tag = get().tags.find((item) => item.id === tagId);
    if (!tag) {
      throw new Error("Tag not found");
    }

    const updatedExpenses = get()
      .expenses.filter(
        (expense) => expense.groupId === tag.groupId && expense.tagIds.includes(tagId),
      )
      .map((expense) => ({
        ...expense,
        tagIds: expense.tagIds.filter((expenseTagId) => expenseTagId !== tagId),
      }));

    await db.transaction("rw", db.tags, db.expenses, async () => {
      await db.tags.delete(tagId);
      if (updatedExpenses.length > 0) {
        await db.expenses.bulkPut(updatedExpenses);
      }
    });

    const updatedById = new Map(
      updatedExpenses.map((expense) => [expense.expenseId, expense] as const),
    );
    set((state) => ({
      tags: state.tags.filter((item) => item.id !== tagId),
      expenses: state.expenses.map((expense) => updatedById.get(expense.expenseId) ?? expense),
    }));
  },
});
