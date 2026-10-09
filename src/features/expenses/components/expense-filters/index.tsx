import { ArrowDownUp, ListFilter, Search } from "lucide-react";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFormContext, useWatch } from "react-hook-form";
import { useOutletContext, useSearchParams } from "react-router-dom";

import ActiveExpenseFilters from "@/features/expenses/components/active-expense-filters";
import ExpenseFilterOptions from "@/features/expenses/components/expense-filter-options";
import Input from "@/shared/components/form-elements/input";

import {
  countActiveExpenseFilters,
  createExpenseFilterDefaults,
  EXPENSE_SORT_SECTIONS,
  pruneUnavailableExpenseFilterOptions,
  SPLIT_FILTER_OPTIONS,
  writeExpenseFilterParams,
} from "@/features/expenses/utils/expense-filters";
import { useViewport } from "@/shared/hooks/use-viewport";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import DialogLayout from "@/shared/ui/dialog-layout";
import Icon from "@/shared/ui/icon";
import MobileEditorDialog from "@/shared/ui/mobile-editor-dialog";

const getPopoverPosition = (details: HTMLDetailsElement, maxWidth: number): CSSProperties => {
  const rect = details.getBoundingClientRect();
  const verticalRect =
    window.innerWidth < 768 ? (details.closest("form")?.getBoundingClientRect() ?? rect) : rect;
  const width = Math.min(window.innerWidth * 0.85, maxWidth);
  const maxHeight = Math.min(window.innerHeight * 0.7, 560);
  const below = window.innerHeight - verticalRect.bottom - 12;
  const above = verticalRect.top - 12;
  const openBelow = below >= maxHeight || below >= above;
  return {
    position: "fixed",
    top: openBelow ? verticalRect.bottom + 4 : undefined,
    bottom: openBelow ? undefined : window.innerHeight - verticalRect.top + 4,
    right: Math.min(Math.max(8, window.innerWidth - rect.right), window.innerWidth - width - 8),
    maxHeight: Math.min(maxHeight, Math.max(0, openBelow ? below : above)),
  };
};

const ExpenseFilters = () => {
  const { isMobile } = useViewport();
  const mobileViewportRef = useRef(isMobile);
  const mobileFiltersTriggerRef = useRef<HTMLButtonElement>(null);
  const previousMobileFiltersOpenRef = useRef(false);
  const filtersRef = useRef<HTMLDetailsElement>(null);
  const sortRef = useRef<HTMLDetailsElement>(null);
  const filtersPanelRef = useRef<HTMLDivElement>(null);
  const sortPanelRef = useRef<HTMLDivElement>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortPosition, setSortPosition] = useState<CSSProperties>();
  const [filtersPosition, setFiltersPosition] = useState<CSSProperties>();
  const [, setSearchParams] = useSearchParams();
  const { group, groupCategories, groupTags, groupMembers } = useOutletContext<GroupDetailContext>();
  const { control, getValues, register, reset, setValue, trigger } =
    useFormContext<ExpenseFilterValues>();
  const values = useWatch({ control }) as ExpenseFilterValues;
  const count = countActiveExpenseFilters(values);
  const members = groupMembers.map((member) => ({
    value: member.id,
    label: member.person?.name ?? "Unknown person",
  }));
  const categoryOptions = groupCategories.map((category) => ({
    value: category.id,
    label: `${category.name}${category.isActive ? "" : " (inactive)"}`,
  }));
  const tagOptions = groupTags.map((tag) => ({ value: tag.id, label: tag.name }));
  const categoryIds = groupCategories.map((category) => category.id);
  const tagIds = groupTags.map((tag) => tag.id);
  const memberIds = groupMembers.map((member) => member.id);

  useEffect(() => {
    if (previousMobileFiltersOpenRef.current && !mobileFiltersOpen) {
      mobileFiltersTriggerRef.current?.focus({ preventScroll: true });
    }
    previousMobileFiltersOpenRef.current = mobileFiltersOpen;
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const current = getValues();
    const next = pruneUnavailableExpenseFilterOptions(current, {
      categoryIds,
      tagIds,
      payerIds: memberIds,
      memberIds,
    });

    let pruned = false;
    for (const field of ["categoryIds", "tagIds", "payerIds", "memberIds"] as const) {
      if (current[field].length !== next[field].length) {
        setValue(field, next[field], { shouldValidate: true });
        pruned = true;
      }
    }
    if (pruned) {
      setSearchParams(writeExpenseFilterParams(next), { replace: true, preventScrollReset: true });
    }
  }, [categoryIds, getValues, memberIds, setSearchParams, setValue, tagIds]);

  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      for (const { details, panel } of [
        { details: filtersRef.current, panel: filtersPanelRef.current },
        { details: sortRef.current, panel: sortPanelRef.current },
      ]) {
        if (
          details?.open &&
          event.target instanceof Node &&
          !details.contains(event.target) &&
          !panel?.contains(event.target)
        ) {
          details.open = false;
        }
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const updatePositions = () => {
      if (sortRef.current?.open) setSortPosition(getPopoverPosition(sortRef.current, 300));
      if (filtersRef.current?.open) setFiltersPosition(getPopoverPosition(filtersRef.current, 560));
    };
    const handleResize = () => {
      const nextMobile = window.innerWidth < 768;
      if (nextMobile !== mobileViewportRef.current) {
        mobileViewportRef.current = nextMobile;
        setMobileFiltersOpen(false);
        setFiltersOpen(false);
        if (filtersRef.current) filtersRef.current.open = false;
      }
      updatePositions();
    };
    window.addEventListener("resize", handleResize);
    const main = document.getElementById("main-content");
    main?.addEventListener("scroll", updatePositions, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      main?.removeEventListener("scroll", updatePositions);
    };
  }, []);

  useLayoutEffect(() => {
    if (window.innerWidth >= 768) return;
    if (sortOpen && sortRef.current) setSortPosition(getPopoverPosition(sortRef.current, 300));
  }, [sortOpen, values]);

  const handleClear = () => {
    const next = { ...createExpenseFilterDefaults(), sort: getValues("sort") };
    reset(next);
    setSearchParams(writeExpenseFilterParams(next), { replace: true, preventScrollReset: true });
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();
  const handleSortChange = () => {
    if (sortRef.current) sortRef.current.open = false;
  };
  const handleSortToggle = () => {
    const open = Boolean(sortRef.current?.open);
    setSortOpen(open);
    if (open && sortRef.current) setSortPosition(getPopoverPosition(sortRef.current, 300));
  };
  const handleFiltersToggle = () => {
    const open = Boolean(filtersRef.current?.open);
    setFiltersOpen(open);
    if (open && filtersRef.current) setFiltersPosition(getPopoverPosition(filtersRef.current, 560));
  };
  const handleOpenMobileFilters = () => {
    if (sortRef.current) sortRef.current.open = false;
    setMobileFiltersOpen(true);
  };
  const handleCloseMobileFilters = () => setMobileFiltersOpen(false);
  const handleChange = () => {
    setSearchParams(writeExpenseFilterParams(getValues()), {
      replace: true,
      preventScrollReset: true,
    });
    void trigger();
  };
  const handleRemoveFilter = (changes: Partial<ExpenseFilterValues>) => {
    const next = { ...getValues(), ...changes };
    for (const field of Object.keys(changes) as (keyof ExpenseFilterValues)[]) {
      setValue(field, next[field], { shouldDirty: true, shouldValidate: true });
    }
    setSearchParams(writeExpenseFilterParams(next), {
      replace: true,
      preventScrollReset: true,
    });
    void trigger();
  };

  const filterFields = (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="min-w-0 text-sm font-bold">
          From date
          <Input name="dateFrom" type="date" className="min-w-0" />
        </label>
        <label className="min-w-0 text-sm font-bold">
          To date
          <Input name="dateTo" type="date" className="min-w-0" />
        </label>
        <label className="min-w-0 text-sm font-bold">
          Minimum amount ({group.currency})<Input name="minAmount" inputMode="decimal" />
        </label>
        <label className="min-w-0 text-sm font-bold">
          Maximum amount ({group.currency})<Input name="maxAmount" inputMode="decimal" />
        </label>
      </div>
      <ExpenseFilterOptions name="categoryIds" label="Categories" options={categoryOptions} />
      <ExpenseFilterOptions name="tagIds" label="Tags" options={tagOptions} />
      <ExpenseFilterOptions name="payerIds" label="Paid by" options={members} />
      <ExpenseFilterOptions name="memberIds" label="Member involved" options={members} />
      <ExpenseFilterOptions name="splitTypes" label="Split types" options={SPLIT_FILTER_OPTIONS} />
    </>
  );

  return (
    <form
      aria-label="Expense filters"
      noValidate
      onSubmit={handleSubmit}
      onChange={handleChange}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative block flex-1 min-w-[160px]">
          <span className="sr-only">Search expenses</span>
          <Icon
            icon={Search}
            size={19}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <Input name="name" type="search" placeholder="Search expenses…" className="!pl-10" />
        </label>
        <details ref={sortRef} onToggle={handleSortToggle} className="group relative">
          <summary className="btn btn-secondary relative z-50 list-none cursor-pointer">
            <Icon icon={ArrowDownUp} size={18} /> Sort
          </summary>
          {createPortal(
            <div
              ref={sortPanelRef}
              hidden={!sortOpen}
              style={sortPosition}
              className="expense-filter-popover surface surface-pad fixed z-40 w-[min(85vw,300px)] overflow-auto"
            >
              <fieldset onChange={handleSortChange}>
                <legend className="mb-3 text-sm font-bold">Sort expenses</legend>
                <div className="flex flex-col">
                  {EXPENSE_SORT_SECTIONS.map((section) => (
                    <div
                      key={section.label}
                      role="group"
                      aria-label={section.label}
                      className="border-t border-[var(--line)] py-3 first:border-t-0 first:pt-0 last:pb-0"
                    >
                      <p className="mb-2 text-xs font-bold text-[var(--muted)]">{section.label}</p>
                      <div className="flex flex-col gap-2">
                        {section.options.map((option) => (
                          <label key={option.value} className="choice-option choice-option-compact">
                            <input
                              type="radio"
                              value={option.value}
                              {...register("sort")}
                              className="choice-control"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>,
            document.body,
          )}
        </details>
        {isMobile ? (
          <button
            ref={mobileFiltersTriggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={mobileFiltersOpen}
            onClick={handleOpenMobileFilters}
            className="btn btn-secondary min-w-0"
          >
            <Icon icon={ListFilter} size={18} /> Filters {count > 0 ? `(${count})` : ""}
          </button>
        ) : (
          <details ref={filtersRef} onToggle={handleFiltersToggle} className="group relative">
            <summary className="btn btn-secondary relative z-50 list-none cursor-pointer">
              <Icon icon={ListFilter} size={18} /> Filters {count > 0 ? `(${count})` : ""}
            </summary>
            {createPortal(
              <div
                ref={filtersPanelRef}
                hidden={!filtersOpen}
                style={filtersPosition}
                className="expense-filter-popover surface surface-pad fixed z-40 w-[min(85vw,560px)] overflow-auto flex flex-col gap-4"
              >
                {filterFields}
                {count > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="self-end text-[var(--brand-ink)]"
                  >
                    Clear all filters
                  </button>
                )}
              </div>,
              document.body,
            )}
          </details>
        )}
      </div>
      <ActiveExpenseFilters
        values={values}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        members={members}
        currency={group.currency}
        onRemove={handleRemoveFilter}
      />
      <div className="flex items-center justify-between gap-3 text-xs">
        <span>
          {count} active {count === 1 ? "filter" : "filters"}
        </span>
        {count > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className={`text-[var(--brand-ink)] ${filtersOpen ? "md:hidden" : ""}`}
          >
            Clear all filters
          </button>
        )}
      </div>
      {isMobile &&
        mobileFiltersOpen &&
        createPortal(
          <MobileEditorDialog title="Filters" onCancel={handleCloseMobileFilters}>
            <DialogLayout
              title="Filters"
              onClose={handleCloseMobileFilters}
              closeLabel="Close filters"
              bodyLabel="Filter controls"
              bodyClassName="flex flex-col gap-4"
              footer={
                <>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={count === 0}
                    className="btn btn-secondary"
                  >
                    Clear all filters
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseMobileFilters}
                    className="btn btn-primary"
                  >
                    Done
                  </button>
                </>
              }
            >
              {filterFields}
            </DialogLayout>
          </MobileEditorDialog>,
          document.body,
        )}
    </form>
  );
};

export default ExpenseFilters;
