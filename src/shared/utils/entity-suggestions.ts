import type { Category, Group, Tag } from "@/shared/types/domain.types";

export interface EntitySuggestion {
  name: string;
  icon?: string;
  color?: string;
  groupNames: string[];
}

export const normalizeSuggestionName = (name: string) =>
  name.toLocaleLowerCase().replace(/[\p{P}\p{S}\p{Z}\s]+/gu, "");

export const entitySuggestions = (
  items: (Category | Tag)[],
  groups: Group[],
  query: string,
  currentGroupId: string | undefined,
  unavailableNames: string[],
): EntitySuggestion[] => {
  const normalizedQuery = normalizeSuggestionName(query);
  if (!normalizedQuery) return [];
  const blocked = new Set(unavailableNames.map((name) => name.trim().toLocaleLowerCase()));
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const suggestions = new Map<string, EntitySuggestion>();

  for (const item of items) {
    const sourceGroup = groupNames.get(item.groupId);
    if (
      !sourceGroup ||
      item.groupId === currentGroupId ||
      blocked.has(item.name.trim().toLocaleLowerCase()) ||
      !normalizeSuggestionName(item.name).includes(normalizedQuery)
    )
      continue;
    const icon = "icon" in item ? item.icon : undefined;
    const color = "color" in item ? item.color : undefined;
    const key = JSON.stringify([item.name, icon, color]);
    const existing = suggestions.get(key);
    if (existing) {
      if (!existing.groupNames.includes(sourceGroup)) existing.groupNames.push(sourceGroup);
    } else {
      suggestions.set(key, { name: item.name, icon, color, groupNames: [sourceGroup] });
    }
  }

  return [...suggestions.values()]
    .map((item) => ({ ...item, groupNames: item.groupNames.sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => {
      const aPrefix = normalizeSuggestionName(a.name).startsWith(normalizedQuery);
      const bPrefix = normalizeSuggestionName(b.name).startsWith(normalizedQuery);
      return Number(bPrefix) - Number(aPrefix) || a.name.localeCompare(b.name);
    })
    .slice(0, 8);
};
