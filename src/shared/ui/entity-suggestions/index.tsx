import { useStore } from "@/shared/configs/store";
import type { EntitySuggestion } from "@/shared/utils/entity-suggestions";
import { entitySuggestions } from "@/shared/utils/entity-suggestions";

import Avatar from "@/shared/ui/avatar";

interface PropsType {
  kind: "category" | "tag";
  query: string;
  currentGroupId?: string;
  unavailableNames: string[];
  disabled?: boolean;
  onSelect: (suggestion: EntitySuggestion) => void;
}

const EntitySuggestions = ({
  kind,
  query,
  currentGroupId,
  unavailableNames,
  disabled = false,
  onSelect,
}: PropsType) => {
  const items = useStore((state) => (kind === "category" ? state.categories : state.tags));
  const groups = useStore((state) => state.groups);
  const suggestions = entitySuggestions(items, groups, query, currentGroupId, unavailableNames);
  if (!suggestions.length) return null;

  return (
    <div
      className="min-w-0 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2"
      aria-label={`${kind} suggestions from other groups`}
    >
      <p className="soft-caption px-2 pb-1">Use a name from another group</p>
      <ul className="max-h-48 overflow-y-auto">
        {suggestions.map((suggestion) => (
          <li key={`${suggestion.name}-${suggestion.icon ?? suggestion.color}`}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(suggestion)}
              className="flex w-full min-w-0 items-center gap-3 rounded-lg p-2 text-left hover:bg-[var(--surface-soft)] disabled:opacity-50"
            >
              {suggestion.icon ? (
                <Avatar icon={suggestion.icon} square className="!h-8 !w-8" />
              ) : (
                <span
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: suggestion.color }}
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0 text-sm">
                <span className="block font-semibold">{suggestion.name}</span>
                <span className="soft-caption block">{suggestion.groupNames.join(", ")}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EntitySuggestions;
