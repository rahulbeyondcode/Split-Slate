import { X } from "lucide-react";

import { SPLIT_FILTER_OPTIONS } from "@/features/expenses/utils/expense-filters";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDisplayDate } from "@/shared/utils/date-time";
import { parseMoney } from "@/shared/utils/money";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";

import Icon from "@/shared/ui/icon";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterChip {
  key: string;
  label: string;
  changes: Partial<ExpenseFilterValues>;
}

interface PropsType {
  values: ExpenseFilterValues;
  categoryOptions: FilterOption[];
  tagOptions: FilterOption[];
  members: FilterOption[];
  currency: string;
  onRemove: (changes: Partial<ExpenseFilterValues>) => void;
}

const formatFilterDate = (value: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
    return value;
  return formatDisplayDate(date);
};

const formatFilterAmount = (value: string, currency: string): string => {
  try {
    return formatCurrency(parseMoney(value, currency), currency);
  } catch {
    return `${value} ${currency}`;
  }
};

const ActiveExpenseFilters = ({
  values,
  categoryOptions,
  tagOptions,
  members,
  currency,
  onRemove,
}: PropsType) => {
  const optionGroups = [
    { field: "categoryIds", label: "Category", options: categoryOptions },
    { field: "tagIds", label: "Tag", options: tagOptions },
    { field: "payerIds", label: "Paid by", options: members },
    { field: "memberIds", label: "Member", options: members },
    { field: "splitTypes", label: "Split", options: SPLIT_FILTER_OPTIONS },
  ] as const;
  const chips: FilterChip[] = optionGroups.flatMap(({ field, label, options }) =>
    values[field].flatMap((value) => {
      const option = options.find((item) => item.value === value);
      if (!option) return [];
      return [
        {
          key: `${field}:${value}`,
          label: `${label}: ${option.label}`,
          changes: { [field]: values[field].filter((selected) => selected !== value) },
        },
      ];
    }),
  );

  if (values.dateFrom || values.dateTo) {
    const from = formatFilterDate(values.dateFrom);
    const to = formatFilterDate(values.dateTo);
    chips.push({
      key: "date",
      label: `Date: ${from && to ? `${from} – ${to}` : from ? `From ${from}` : `Until ${to}`}`,
      changes: { dateFrom: "", dateTo: "" },
    });
  }
  if (values.minAmount.trim() || values.maxAmount.trim()) {
    const minimum = values.minAmount.trim() ? formatFilterAmount(values.minAmount, currency) : "";
    const maximum = values.maxAmount.trim() ? formatFilterAmount(values.maxAmount, currency) : "";
    chips.push({
      key: "amount",
      label: `Amount: ${minimum && maximum ? `${minimum} – ${maximum}` : minimum ? `At least ${minimum}` : `At most ${maximum}`}`,
      changes: { minAmount: "", maxAmount: "" },
    });
  }

  if (!chips.length) return null;

  return (
    <ul
      aria-label="Selected expense filters"
      className="flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pt-1 pb-[16px]"
    >
      {chips.map((chip) => (
        <li key={chip.key} className="shrink-0">
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            onClick={() => onRemove(chip.changes)}
            className="flex min-h-[24px] items-center gap-1 whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--brand-soft)] px-2 py-0.5 text-left !text-[0.625rem] font-semibold !leading-3 text-[var(--brand-ink)] transition-colors hover:bg-[var(--surface-soft)]"
          >
            <span>{chip.label}</span>
            <Icon icon={X} size={10} className="shrink-0" />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ActiveExpenseFilters;
