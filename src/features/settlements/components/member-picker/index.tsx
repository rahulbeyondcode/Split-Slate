import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";

import type { SettlementFormValues } from "@/features/settlements/utils/settlement-schema";

import type { Member, Person } from "@/shared/types/domain.types";

import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";

interface PropsType {
  name: "fromMemberId" | "toMemberId";
  label: string;
  members: (Member & { person?: Person })[];
}

const MemberPicker = ({ name, label, members }: PropsType) => {
  const { control, formState } = useFormContext<SettlementFormValues>();
  const { field, fieldState } = useController({ name, control });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selected = members.find((member) => member.id === field.value);
  const visible = members.filter((member) =>
    (member.person?.name ?? "Unknown person")
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open]);

  const handleToggle = () => {
    setQuery("");
    setOpen((current) => !current);
  };
  const handleSelect = (memberId: string) => {
    field.onChange(memberId);
    field.onBlur();
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className="member-picker min-w-0">
      <span className="field-label">{label}</span>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${selected?.person?.name ?? "Choose member"}`}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={fieldState.error ? true : undefined}
        disabled={formState.isSubmitting}
        onClick={handleToggle}
        className="member-picker-trigger"
      >
        {selected && (
          <Avatar icon={selected.person?.icon} name={selected.person?.name} className="!h-8 !w-8" />
        )}
        <span className={`min-w-0 flex-1 truncate text-left ${selected ? "" : "muted"}`}>
          {selected?.person?.name ?? "Choose member"}
        </span>
        <Icon icon={ChevronDown} size={18} className="text-[var(--muted)]" />
      </button>
      {open && (
        <div className="member-picker-panel" id={listId}>
          <label className="member-picker-search">
            <Icon icon={Search} size={16} className="text-[var(--muted)]" />
            <span className="sr-only">Search {label.toLocaleLowerCase()}</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members"
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
          <ul className="member-picker-options" aria-label={`${label} options`}>
            {visible.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  aria-pressed={field.value === member.id}
                  onClick={() => handleSelect(member.id)}
                  className="member-picker-option"
                >
                  <Avatar
                    icon={member.person?.icon}
                    name={member.person?.name}
                    className="!h-8 !w-8"
                  />
                  <span className="min-w-0 flex-1 truncate text-left">
                    {member.person?.name ?? "Unknown person"}
                  </span>
                  {field.value === member.id && (
                    <Icon icon={Check} size={17} className="text-[var(--brand-ink)]" />
                  )}
                </button>
              </li>
            ))}
            {visible.length === 0 && <li className="p-3 text-sm muted">No matching members</li>}
          </ul>
        </div>
      )}
      {fieldState.error && (
        <p role="alert" className="mt-1 text-xs money-negative">
          {fieldState.error.message}
        </p>
      )}
    </div>
  );
};

export default MemberPicker;
