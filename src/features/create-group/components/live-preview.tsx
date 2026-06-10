import { useStore } from "@/shared/configs/store";

import { CURRENCIES } from "@/shared/constants/currencies";

// Placeholder until the tags feature ships. Tags are plain text + a user-picked colour;
// they are not part of the group draft yet, so they are hardcoded here for the preview.
const PLACEHOLDER_TAGS = [
  { name: "Trip", color: "#6366f1" },
  { name: "Reimbursable", color: "#10b981" },
  { name: "Recurring", color: "#f59e0b" },
];

const MAX_AVATARS = 5;

const LivePreview = () => {
  const groupDraft = useStore((s) => s.groupDraft);
  const localUser = useStore((s) => s.localUser);

  if (!groupDraft) return null;

  const { name, icon, currency, categories, members } = groupDraft;

  // The creator is always in the group but is not part of the draft's members array.
  const allMembers = localUser ? [localUser, ...members] : members;
  const memberCount = allMembers.length;
  const visibleMembers = allMembers.slice(0, MAX_AVATARS);
  const overflow = memberCount - visibleMembers.length;
  const currencySymbol = CURRENCIES.find((curr) => curr.code === currency)?.symbol ?? "";

  const details = [
    { label: "Name", value: name || "—" },
    { label: "Categories", value: `${categories.length} selected` },
    { label: "Tags", value: `${PLACEHOLDER_TAGS.length} selected` },
    { label: "Currency", value: `${currency} · ${currencySymbol}` },
    { label: "Members", value: String(memberCount) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Live preview</span>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-2xl">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-gray-900">{name || "Untitled group"}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {memberCount} {memberCount === 1 ? "person" : "people"} · {currency}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          {visibleMembers.map((member, index) => (
            <span
              key={index}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-sm leading-none"
              style={{ marginLeft: index === 0 ? 0 : "-10px", zIndex: index }}
            >
              {member.icon}
            </span>
          ))}
          {overflow > 0 && <span className="ml-2 text-xs text-gray-400">+{overflow} more</span>}
        </div>
      </div>

      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
        {details.map((detail) => (
          <div key={detail.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-500">{detail.label}</span>
            <span className="text-sm font-medium text-gray-900">{detail.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Categories</span>
        {categories.length ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.name}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No categories selected</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Tags</span>
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDER_TAGS.map((tag) => (
            <span
              key={tag.name}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
