import { existsSync, readdirSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { SEED_MASTER_CATEGORIES } from "@/shared/constants/categories";
import {
  DEFAULT_OTHER_EMOJI,
  DEFAULT_PROFILE_EMOJI,
  EMOJI_CATALOG,
  emojiValue,
  isEmojiForKind,
  OTHER_EMOJIS,
  PROFILE_EMOJIS,
} from "@/shared/constants/emoji-catalog";
import { CATEGORY_EMOJIS, GROUP_EMOJIS, PERSON_EMOJIS } from "@/shared/constants/emojis";

const assetFolder = fileURLToPath(new URL("../../../../public/emoji-icons/", import.meta.url));

describe("emoji image catalog", () => {
  it("covers selectable assets with unique values and readable names", () => {
    expect(EMOJI_CATALOG).toHaveLength(325);
    expect(new Set(EMOJI_CATALOG.map((item) => item.value)).size).toBe(325);
    for (const item of EMOJI_CATALOG) {
      expect(item.label).not.toMatch(/-3d|\.png/u);
      expect(existsSync(fileURLToPath(new URL(item.value, `file://${assetFolder}/`)))).toBe(true);
    }
  });

  it("keeps profile images out of category and group choices", () => {
    expect(PROFILE_EMOJIS).toHaveLength(127);
    expect(OTHER_EMOJIS).toHaveLength(198);
    for (const value of PERSON_EMOJIS) expect(isEmojiForKind(value, "profile")).toBe(true);
    for (const value of [
      ...GROUP_EMOJIS,
      ...CATEGORY_EMOJIS,
      ...SEED_MASTER_CATEGORIES.map((c) => c.icon),
    ]) {
      expect(isEmojiForKind(value, "other")).toBe(true);
    }
    const suggestions = readdirSync(
      new URL("../../../../public/emoji-icons/group-icccons/", import.meta.url),
    );
    expect(GROUP_EMOJIS).toHaveLength(45);
    expect(new Set(GROUP_EMOJIS.map((value) => basename(value)))).toEqual(new Set(suggestions));
  });

  it("never displays arbitrary text as an image URL", () => {
    expect(emojiValue("🦊", "profile")).toBe(DEFAULT_PROFILE_EMOJI);
    expect(emojiValue("profile-pic/fox-3d.png", "other")).toBe(DEFAULT_OTHER_EMOJI);
    expect(emojiValue("https://example.com/image.png", "other")).toBe(DEFAULT_OTHER_EMOJI);
    expect(emojiValue("constructor", "other")).toBe(DEFAULT_OTHER_EMOJI);
  });

  it("displays previously saved category icons as distinct existing PNGs", () => {
    const oldCategories = [
      ["🍔", "food-and-drinks/hamburger-3d.png"],
      ["🚗", "travel-and-places/automobile-3d.png"],
      ["🏠", "travel-and-places/house-with-garden-3d.png"],
      ["🎬", "objects/clapper-board-3d.png"],
      ["🛒", "objects/shopping-cart-3d.png"],
      ["💡", "objects/light-bulb-3d.png"],
      ["🏥", "travel-and-places/hospital-3d.png"],
      ["🥦", "food-and-drinks/broccoli-3d.png"],
      ["✈️", "travel-and-places/airplane-3d.png"],
      ["🎓", "objects/graduation-cap-3d.png"],
      ["⚽", "activities/soccer-ball-3d.png"],
      ["📦", "objects/package-3d.png"],
      ["☕", "food-and-drinks/hot-beverage-3d.png"],
      ["🍻", "food-and-drinks/clinking-beer-mugs-3d.png"],
      ["🍽️", "food-and-drinks/fork-and-knife-with-plate-3d.png"],
      ["🐶", "objects/shopping-bags-3d.png"],
    ];
    for (const [saved, image] of oldCategories) {
      expect(emojiValue(saved, "other")).toBe(image);
      expect(isEmojiForKind(image, "other")).toBe(true);
    }
    expect(emojiValue("🍔", "profile")).toBe(DEFAULT_PROFILE_EMOJI);
  });
});
