import { useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";

import { useStore } from "@/shared/configs/store";
import { formatCurrency } from "@/shared/utils/currency";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

const ExpenseDetail = () => {
  const { expenseId } = useParams();
  const { group, groupExpenses, groupMembers, groupCategories, groupTags } =
    useOutletContext<GroupDetailContext>();
  const expense = groupExpenses.find((item) => item.expenseId === expenseId);
  const removeExpense = useStore((state) => state.removeExpense);
  const navigate = useNavigate();
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
      navigate(`/groups/${group.id}/expenses`, { replace: true });
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
        <Link to={`/groups/${group.id}/expenses`} className="text-blue-700">
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
      <Link to={`/groups/${group.id}/expenses`} className="text-sm text-blue-700">
        Back to expenses
      </Link>
      <div>
        <h2 className="break-words text-xl font-semibold">{expense.expenseName}</h2>
        <p className="mt-2 text-2xl font-semibold">
          {formatCurrency(
            expense.transactions.paid.reduce((sum, row) => sum + row.amount, 0),
            group.currency,
          )}
        </p>
        <p className="mt-2 text-sm text-gray-600">{new Date(expense.when).toLocaleString()}</p>
        <p className="text-sm text-gray-600">
          {category?.icon} {category?.name ?? "Unknown category"}
          {category && !category.isActive ? " (inactive)" : ""}
        </p>
        <p className="text-sm text-gray-600">Recorded by {memberName(expense.createdBy)}</p>
      </div>
      {expense.tagIds.length > 0 && (
        <ul aria-label="Tags" className="flex flex-wrap gap-2">
          {expense.tagIds.map((id) => {
            const tag = groupTags.find((item) => item.id === id);
            return tag ? (
              <li
                key={id}
                className="flex items-center gap-2 rounded border border-gray-200 px-2 py-1 text-sm"
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </li>
            ) : null;
          })}
        </ul>
      )}
      <section className="flex flex-col gap-2" aria-label="Paid by">
        <h3 className="font-semibold">Paid by</h3>
        <ul className="flex flex-col gap-2">
          {expense.transactions.paid.map((row) => (
            <li
              key={row.memberId}
              className="flex justify-between gap-3 rounded border border-gray-200 p-3"
            >
              <span>{memberName(row.memberId)}</span>
              <span>{formatCurrency(row.amount, group.currency)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-2" aria-label="Split breakdown">
        <h3 className="font-semibold">Split: {splitNames[expense.splitType]}</h3>
        <ul className="flex flex-col gap-2">
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
              <li
                key={row.memberId}
                className="flex justify-between gap-3 rounded border border-gray-200 p-3"
              >
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
          className="flex flex-col gap-3 rounded border border-red-300 p-4"
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
              className="rounded border border-gray-300 px-4 py-2 text-sm"
            >
              Keep expense
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="rounded bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </section>
      ) : (
        <div className="flex flex-wrap gap-4">
          <Link
            to={`/groups/${group.id}/expenses/${expense.expenseId}/edit`}
            className="rounded bg-gray-900 px-4 py-2 text-sm text-white"
          >
            Edit expense
          </Link>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-700"
          >
            Delete expense
          </button>
        </div>
      )}
    </article>
  );
};

export default ExpenseDetail;
