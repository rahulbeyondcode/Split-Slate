import type { FormEvent } from "react";
import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useOutletContext } from "react-router-dom";

import ExpenseFilterOptions from "@/features/expenses/components/expense-filter-options";
import Input from "@/shared/components/form-elements/input";

import {
  countActiveExpenseFilters,
  createExpenseFilterDefaults,
  pruneUnavailableExpenseFilterOptions,
  SPLIT_FILTER_OPTIONS,
} from "@/features/expenses/utils/expense-filters";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const ExpenseFilters = () => {
  const { group, groupCategories, groupTags, groupMembers } =
    useOutletContext<GroupDetailContext>();
  const { control, getValues, reset, setValue, trigger } = useFormContext<ExpenseFilterValues>();
  const values = useWatch({ control }) as ExpenseFilterValues;
  const count = countActiveExpenseFilters(values);
  const members = groupMembers.map((member) => ({
    value: member.id,
    label: member.person?.name ?? "Unknown person",
  }));
  const categoryIds = groupCategories.map((category) => category.id);
  const tagIds = groupTags.map((tag) => tag.id);
  const memberIds = groupMembers.map((member) => member.id);

  useEffect(() => {
    const current = getValues();
    const next = pruneUnavailableExpenseFilterOptions(current, {
      categoryIds,
      tagIds,
      payerIds: memberIds,
      memberIds,
    });

    for (const field of ["categoryIds", "tagIds", "payerIds", "memberIds"] as const) {
      if (current[field].length !== next[field].length) {
        setValue(field, next[field], { shouldValidate: true });
      }
    }
  }, [categoryIds, getValues, memberIds, setValue, tagIds]);

  const handleClear = () => reset(createExpenseFilterDefaults());
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();
  const handleChange = () => {
    void trigger();
  };

  return (
    <form
      aria-label="Expense filters"
      noValidate
      onSubmit={handleSubmit}
      onChange={handleChange}
      className="flex flex-col gap-3 rounded border border-gray-200 p-4"
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Search expenses
        <Input name="name" type="search" placeholder="Search by name" />
      </label>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>
          {count} active {count === 1 ? "filter" : "filters"}
        </span>
        <button
          type="button"
          onClick={handleClear}
          disabled={!count}
          className="text-blue-700 disabled:text-gray-400"
        >
          Clear all filters
        </button>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-medium">More filters</summary>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="min-w-0 text-sm">
              From date
              <Input name="dateFrom" type="date" className="min-w-0" />
            </label>
            <label className="min-w-0 text-sm">
              To date
              <Input name="dateTo" type="date" className="min-w-0" />
            </label>
            <label className="min-w-0 text-sm">
              Minimum amount ({group.currency})<Input name="minAmount" inputMode="decimal" />
            </label>
            <label className="min-w-0 text-sm">
              Maximum amount ({group.currency})<Input name="maxAmount" inputMode="decimal" />
            </label>
          </div>
          <ExpenseFilterOptions
            name="categoryIds"
            label="Categories"
            options={groupCategories.map((category) => ({
              value: category.id,
              label: `${category.name}${category.isActive ? "" : " (inactive)"}`,
            }))}
          />
          <ExpenseFilterOptions
            name="tagIds"
            label="Tags"
            options={groupTags.map((tag) => ({ value: tag.id, label: tag.name }))}
          />
          <ExpenseFilterOptions name="payerIds" label="Paid by" options={members} />
          <ExpenseFilterOptions name="memberIds" label="Member involved" options={members} />
          <ExpenseFilterOptions
            name="splitTypes"
            label="Split types"
            options={SPLIT_FILTER_OPTIONS}
          />
        </div>
      </details>
    </form>
  );
};

export default ExpenseFilters;
