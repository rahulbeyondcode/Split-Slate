import { useState } from "react";

import type { Tag } from "@/shared/types/domain.types";

interface PropsType {
  tagIds: string[];
  tags: Tag[];
  expenseName: string;
  className?: string;
}

const ExpenseTags = ({ tagIds, tags, expenseName, className = "" }: PropsType) => {
  const [expanded, setExpanded] = useState(false);
  const expenseTags = tagIds.flatMap((id) => {
    const tag = tags.find((item) => item.id === id);
    return tag ? [tag] : [];
  });
  if (!expenseTags.length) return null;
  const remaining = expenseTags.length - 3;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <ul aria-label={`Tags for ${expenseName}`} className="flex flex-wrap gap-1.5">
        {(expanded ? expenseTags : expenseTags.slice(0, 3)).map((tag) => (
          <li key={tag.id} className="chip !px-2 !py-1">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color }}
              aria-hidden="true"
            />
            <span className="max-w-36 truncate">{tag.name}</span>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Show less" : "Show more"} tags for ${expenseName}`}
          onClick={() => setExpanded((current) => !current)}
          className="rounded-lg px-2 py-1 text-xs font-bold text-[var(--brand-ink)] hover:bg-[var(--brand-soft)]"
        >
          {expanded ? "Show less" : `Show more (+${remaining})`}
        </button>
      )}
    </div>
  );
};

export default ExpenseTags;
