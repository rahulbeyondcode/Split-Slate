import { ArrowLeft, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";

import TagCreator from "@/features/expenses/components/tag-creator";

import { formatPercentageDisplay } from "@/features/expenses/utils/percentage-display";
import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDisplayDate, formatDisplayTime } from "@/shared/utils/date-time";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Tag } from "@/shared/types/domain.types";

import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";

const ExpenseDetail = () => {
  const { expenseId } = useParams();
  const { group, groupExpenses, groupMembers, groupCategories, groupTags } =
    useOutletContext<GroupDetailContext>();
  const expense = groupExpenses.find((item) => item.expenseId === expenseId);
  const removeExpense = useStore((state) => state.removeExpense);
  const updateExpenseDetails = useStore((state) => state.updateExpenseDetails);
  const addTag = useStore((state) => state.addTag);
  const navigate = useNavigate();
  const { search } = useLocation();
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [openPanel, setOpenPanel] = useState<"tags" | "categories" | null>(null);
  const savingDetailsRef = useRef(false);
  const tagsPopoverRef = useRef<HTMLDivElement>(null);
  const categoriesPopoverRef = useRef<HTMLDivElement>(null);
  const memberName = (id: string) =>
    groupMembers.find((member) => member.id === id)?.person?.name ?? "Unknown person";
  const handleDelete = async () => {
    if (!expense) return;
    await removeExpense(expense.expenseId, group.id);
    navigate(`/groups/${group.id}/expenses${search}`, { replace: true });
  };
  const handleConfirm = () => {
    setConfirmingDeletion(true);
  };
  const handleSaveDetails = async (patch: { categoryId?: string; tagIds?: string[] }) => {
    if (!expense || savingDetailsRef.current) return;
    savingDetailsRef.current = true;
    setSavingDetails(true);
    setDetailError("");
    try {
      await updateExpenseDetails(expense.expenseId, group.id, patch);
      if (patch.categoryId !== undefined) categoriesPopoverRef.current?.hidePopover();
    } catch (failure) {
      setDetailError(
        failure instanceof Error ? failure.message : "Could not save expense details. Try again.",
      );
    } finally {
      savingDetailsRef.current = false;
      setSavingDetails(false);
    }
  };
  const handleToggleTag = (id: string) => {
    if (!expense) return;
    const tagIds = expense.tagIds.includes(id)
      ? expense.tagIds.filter((tagId) => tagId !== id)
      : [...expense.tagIds, id];
    void handleSaveDetails({ tagIds });
  };
  const handleChooseCategory = (id: string) => {
    if (!expense || expense.categoryId === id) {
      categoriesPopoverRef.current?.hidePopover();
      return;
    }
    void handleSaveDetails({ categoryId: id });
  };
  const handleCreateTag = async (name: string, color: string) => {
    const tag: Tag = await addTag(group.id, name, color);
    setCreatingTag(false);
    if (expense) await handleSaveDetails({ tagIds: [...expense.tagIds, tag.id] });
  };
  const handleOpenPopover = (panel: "tags" | "categories", anchor: HTMLElement) => {
    const popover = panel === "tags" ? tagsPopoverRef.current : categoriesPopoverRef.current;
    if (!popover) return;
    if (popover.matches(":popover-open")) {
      popover.hidePopover();
      return;
    }
    const rect = anchor.getBoundingClientRect();
    popover.style.right = "auto";
    popover.style.bottom = "auto";
    popover.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 288))}px`;
    popover.showPopover();
    const height = popover.getBoundingClientRect().height;
    popover.style.top = `${rect.bottom + height + 8 <= window.innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - height - 8)}px`;
  };
  const handleOpenTags = (event: MouseEvent<HTMLButtonElement>) => {
    handleOpenPopover("tags", event.currentTarget);
  };
  const handleOpenCategories = (event: MouseEvent<HTMLButtonElement>) => {
    handleOpenPopover("categories", event.currentTarget);
  };
  const handleOpenTagCreator = () => {
    tagsPopoverRef.current?.hidePopover();
    setCreatingTag(true);
  };

  if (!expense)
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Expense not found</h2>
        <p>This expense is not available in this group.</p>
        <Link to={`/groups/${group.id}/expenses${search}`} className="btn btn-secondary self-start">
          <Icon icon={ArrowLeft} size={18} /> Back to expenses
        </Link>
      </section>
    );
  const category = groupCategories.find((item) => item.id === expense.categoryId);
  const splitNames = {
    equal: "Equal",
    amount: "Exact amounts",
    shares: "Shares",
    percentage: "Percentages",
    adjustment: "Adjustments",
  };

  return (
    <article className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <Link to={`/groups/${group.id}/expenses${search}`} className="btn btn-secondary min-w-0">
          <Icon icon={ArrowLeft} size={18} /> Back to expenses
        </Link>
        <div className="flex shrink-0 gap-2">
          <Link
            to={`/groups/${group.id}/expenses/${expense.expenseId}/edit${search}`}
            className="btn btn-primary max-sm:!px-3"
            aria-label="Edit expense"
          >
            <Icon icon={Pencil} size={18} /> <span className="max-sm:hidden">Edit expense</span>
          </Link>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-danger max-sm:!px-3"
            aria-label="Delete expense"
          >
            <Icon icon={Trash2} size={18} /> <span className="max-sm:hidden">Delete expense</span>
          </button>
        </div>
      </div>
      <ConfirmationDialog
        open={confirmingDeletion}
        title={`Delete ${expense.expenseName}?`}
        description={
          <>
            “{expense.expenseName}” and its receipts will be permanently deleted. Group balances
            will be recalculated. This cannot be undone.
          </>
        }
        confirmLabel="Delete permanently"
        onCancel={() => setConfirmingDeletion(false)}
        onConfirm={handleDelete}
      />
      <div className="hero">
        <div className="grid gap-5 sm:grid-cols-2 sm:items-center sm:gap-6">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-extrabold">{expense.expenseName}</h2>
            <p className="hero-number mt-2">
              {formatCurrency(
                expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
                group.currency,
              )}
            </p>
          </div>
          <div className="order-3 min-w-0 space-y-2 text-sm text-white/85 sm:order-2 sm:border-l sm:border-white/25 sm:pl-6">
            <p className="text-base">
              Date:{" "}
              <span className="font-semibold text-white">{formatDisplayDate(expense.when)}</span>
            </p>
            <p className="text-base">
              Time:{" "}
              <span className="font-semibold text-white">{formatDisplayTime(expense.when)}</span>
            </p>
            <button
              type="button"
              onClick={handleOpenCategories}
              aria-label="Change category"
              aria-expanded={openPanel === "categories"}
              disabled={savingDetails}
              className="-ml-2 flex items-center gap-2 rounded-lg px-2 py-1 text-left text-base font-semibold text-white hover:bg-white/15 focus-visible:!outline-white disabled:opacity-60"
            >
              <EmojiImage icon={category?.icon} /> {category?.name ?? "Unknown category"}
              {category && !category.isActive ? " (inactive)" : ""}
              <Icon icon={ChevronDown} size={16} />
            </button>
          </div>
          <div className="order-2 flex min-w-0 flex-wrap items-center gap-2 border-t border-white/25 pt-4 sm:order-3 sm:col-span-2">
            {expense.tagIds.length > 0 && (
              <ul aria-label="Tags" className="flex flex-wrap gap-2">
                {expense.tagIds.map((id) => {
                  const tag = groupTags.find((item) => item.id === id);
                  return tag ? (
                    <li key={id} className="chip !border-white/25 !bg-white/15 !text-white">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </li>
                  ) : null;
                })}
              </ul>
            )}
            <button
              type="button"
              onClick={handleOpenTags}
              aria-expanded={openPanel === "tags"}
              className="rounded-full border border-dashed border-white/70 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              <Icon icon={Plus} size={14} /> Add tags
            </button>
          </div>
        </div>
      </div>
      {detailError && (
        <p role="alert" className="note money-negative">
          {detailError}
        </p>
      )}
      <div
        ref={tagsPopoverRef}
        popover="auto"
        onToggle={() =>
          setOpenPanel((current) =>
            tagsPopoverRef.current?.matches(":popover-open")
              ? "tags"
              : current === "tags"
                ? null
                : current,
          )
        }
        aria-label="Choose tags"
        className="!m-0 w-70 max-h-[min(70svh,440px)] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-[var(--ink)] shadow-xl"
      >
        <p className="mb-3 font-semibold">Tags</p>
        {groupTags.length ? (
          <ul className="flex flex-col gap-1">
            {groupTags.map((tag) => (
              <li key={tag.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-[var(--surface-soft)]">
                  <input
                    type="checkbox"
                    checked={expense.tagIds.includes(tag.id)}
                    disabled={savingDetails}
                    onChange={() => handleToggleTag(tag.id)}
                    className="choice-control"
                  />
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="min-w-0 break-words">{tag.name}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)]">No tags yet.</p>
        )}
        <button
          type="button"
          disabled={savingDetails}
          onClick={handleOpenTagCreator}
          className="btn btn-secondary mt-3"
        >
          <Icon icon={Plus} size={16} /> Create new tag
        </button>
      </div>
      <div
        ref={categoriesPopoverRef}
        popover="auto"
        onToggle={() =>
          setOpenPanel((current) =>
            categoriesPopoverRef.current?.matches(":popover-open")
              ? "categories"
              : current === "categories"
                ? null
                : current,
          )
        }
        aria-label="Choose category"
        className="!m-0 w-70 max-h-[min(70svh,440px)] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[var(--ink)] shadow-xl"
      >
        <p className="mb-2 px-2 font-semibold">Category</p>
        {groupCategories
          .filter((item) => item.isActive || item.id === expense.categoryId)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={savingDetails}
              onClick={() => handleChooseCategory(item.id)}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-[var(--surface-soft)] disabled:opacity-60"
            >
              <EmojiImage icon={item.icon} /> {item.name}
              {item.isActive ? "" : " (inactive)"}
              {expense.categoryId === item.id && <span className="ml-auto">✓</span>}
            </button>
          ))}
      </div>
      {creatingTag && (
        <TagCreator
          groupId={group.id}
          existingNames={groupTags.map((tag) => tag.name)}
          onAdd={handleCreateTag}
          onCancel={() => setCreatingTag(false)}
        />
      )}
      <p className="-my-2 px-1 text-xs text-[var(--muted)]">
        Recorded by{" "}
        <span className="font-semibold text-[var(--ink)]">{memberName(expense.createdBy)}</span>
        {" · "}
        {formatDisplayDate(expense.createdAt)}
      </p>
      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
        <section className="surface surface-pad flex min-w-0 flex-col gap-2" aria-label="Paid by">
          <h3 className="section-title">Paid by</h3>
          <ul>
            {expense.transactions.paid.map((row) => (
              <li key={row.memberId} className="ui-row flex-wrap justify-between gap-x-2">
                <span className="break-words">{memberName(row.memberId)}</span>
                <span>{formatCurrency(row.amount, group.currency)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section
          className="surface surface-pad flex min-w-0 flex-col gap-2"
          aria-label="Split breakdown"
        >
          <h3 className="section-title">Split: {splitNames[expense.splitType]}</h3>
          <ul>
            {expense.transactions.owes.map((row) => {
              const meta = expense.splitMeta.find((item) => item.memberId === row.memberId);
              const detail = meta
                ? expense.splitType === "adjustment"
                  ? `Adjustment: ${formatCurrency(Number(meta.value), group.currency)}`
                  : expense.splitType === "percentage"
                    ? `${formatPercentageDisplay(meta.value)}%`
                    : `${meta.value} shares`
                : "";
              return (
                <li key={row.memberId} className="ui-row flex-wrap justify-between gap-x-2">
                  <div className="min-w-0 break-words">
                    {memberName(row.memberId)}
                    {detail && <p className="text-xs text-gray-500">{detail}</p>}
                  </div>
                  <span>{formatCurrency(row.amount, group.currency)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </article>
  );
};

export default ExpenseDetail;
