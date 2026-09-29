import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";

import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";

const ExpenseDetail = () => {
  const { expenseId } = useParams();
  const { group, groupExpenses, groupMembers, groupCategories, groupTags } =
    useOutletContext<GroupDetailContext>();
  const expense = groupExpenses.find((item) => item.expenseId === expenseId);
  const removeExpense = useStore((state) => state.removeExpense);
  const navigate = useNavigate();
  const { search } = useLocation();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [error, setError] = useState("");
  const memberName = (id: string) =>
    groupMembers.find((member) => member.id === id)?.person?.name ?? "Unknown person";
  const handleDelete = async () => {
    if (!expense || deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError("");
    try {
      await removeExpense(expense.expenseId, group.id);
      navigate(`/groups/${group.id}/expenses${search}`, { replace: true });
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not delete expense. Please try again.",
      );
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  };
  const handleConfirm = () => {
    setError("");
    setConfirmingId(expenseId ?? null);
  };

  if (!expense)
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Expense not found</h2>
        <p>This expense is not available in this group.</p>
        <Link to={`/groups/${group.id}/expenses${search}`} className="text-blue-700">
          Back to expenses
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
      <Link to={`/groups/${group.id}/expenses${search}`} className="btn btn-secondary self-start">
        <Icon icon={ArrowLeft} size={18} /> Back to expenses
      </Link>
      <div className="hero">
        <h2 className="break-words text-xl font-extrabold">{expense.expenseName}</h2>
        <p className="hero-number mt-2">
          {formatCurrency(
            expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
            group.currency,
          )}
        </p>
        <p className="mt-2 text-sm text-white/85">{new Date(expense.when).toLocaleString()}</p>
        <p className="text-sm text-white/85">
          <EmojiImage icon={category?.icon} /> {category?.name ?? "Unknown category"}
          {category && !category.isActive ? " (inactive)" : ""}
        </p>
        <p className="text-sm text-white/85">Recorded by {memberName(expense.createdBy)}</p>
      </div>
      {expense.tagIds.length > 0 && (
        <ul aria-label="Tags" className="flex flex-wrap gap-2">
          {expense.tagIds.map((id) => {
            const tag = groupTags.find((item) => item.id === id);
            return tag ? (
              <li key={id} className="chip">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </li>
            ) : null;
          })}
        </ul>
      )}
      <section className="surface surface-pad flex flex-col gap-2" aria-label="Paid by">
        <h3 className="section-title">Paid by</h3>
        <ul>
          {expense.transactions.paid.map((row) => (
            <li key={row.memberId} className="ui-row justify-between">
              <span>{memberName(row.memberId)}</span>
              <span>{formatCurrency(row.amount, group.currency)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="surface surface-pad flex flex-col gap-2" aria-label="Split breakdown">
        <h3 className="section-title">Split: {splitNames[expense.splitType]}</h3>
        <ul>
          {expense.transactions.owes.map((row) => {
            const meta = expense.splitMeta.find((item) => item.memberId === row.memberId);
            const detail = meta
              ? expense.splitType === "adjustment"
                ? `Adjustment: ${formatCurrency(Number(meta.value), group.currency)}`
                : expense.splitType === "percentage"
                  ? `${meta.value}%`
                  : `${meta.value} shares`
              : "";
            return (
              <li key={row.memberId} className="ui-row justify-between">
                <div>
                  {memberName(row.memberId)}
                  {detail && <p className="text-xs text-gray-500">{detail}</p>}
                </div>
                <span>{formatCurrency(row.amount, group.currency)}</span>
              </li>
            );
          })}
        </ul>
      </section>
      {confirmingId === expense.expenseId ? (
        <section
          aria-label="Confirm expense deletion"
          className="surface surface-pad flex flex-col gap-3 !border-[var(--negative)]"
        >
          <h3 className="font-semibold">Delete this expense permanently?</h3>
          <p className="text-sm">
            “{expense.expenseName}” and its receipts will be permanently deleted. Group balances
            will be recalculated. This cannot be undone.
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmingId(null)}
              className="btn btn-secondary"
            >
              Keep expense
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="btn btn-danger"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </section>
      ) : (
        <div className="flex flex-wrap gap-4">
          <Link
            to={`/groups/${group.id}/expenses/${expense.expenseId}/edit${search}`}
            className="btn btn-primary"
          >
            Edit expense
          </Link>
          <button type="button" onClick={handleConfirm} className="btn btn-danger">
            Delete expense
          </button>
        </div>
      )}
    </article>
  );
};

export default ExpenseDetail;
