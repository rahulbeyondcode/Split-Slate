import { Check, Paperclip, ReceiptText, Shapes, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { TransferSelection } from "@/features/import-export/types/import-export.types";

import Icon from "@/shared/ui/icon";

interface PropsType {
  attachmentCount: number;
}

type DependencyNotice = "expenses" | "receipts" | null;

const ExportContentSelector = ({ attachmentCount }: PropsType) => {
  const { control, setValue } = useFormContext<TransferSelection>();
  const selection = useWatch({ control });
  const [notice, setNotice] = useState<DependencyNotice>(null);
  const noticeDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = noticeDialogRef.current;
    if (notice && !dialog?.open) dialog?.showModal();
    if (!notice && dialog?.open) dialog.close();
  }, [notice]);

  const setChecked = (name: keyof TransferSelection, checked: boolean) => {
    setValue(name, checked, { shouldDirty: true, shouldValidate: true });
  };

  const handleCategories = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked("categories", event.currentTarget.checked);
  };
  const handleTags = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked("tags", event.currentTarget.checked);
  };
  const handleMembers = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked("members", event.currentTarget.checked);
  };
  const handleExpenses = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;
    setChecked("expenses", checked);
    if (checked) {
      setChecked("categories", true);
      setChecked("members", true);
      setNotice("expenses");
    }
  };
  const handleAttachments = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;
    setChecked("attachments", checked);
    if (checked) {
      setChecked("expenses", true);
      setChecked("categories", true);
      setChecked("members", true);
      setNotice("receipts");
    }
  };
  const handleCloseNotice = () => {
    noticeDialogRef.current?.close();
    setNotice(null);
  };

  return (
    <fieldset className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] p-4">
      <legend className="px-1 font-semibold">Choose content</legend>
      <p className="text-sm text-gray-600">
        Only group information is selected initially. Choose every additional section you want on
        the new device.
      </p>

      <label className="choice-option text-sm">
        <input type="checkbox" checked disabled className="choice-control" />
        <span>
          <span className="block font-medium">Group information</span>
          <span className="block text-[var(--muted)]">
            Required for every transfer · cannot be removed
          </span>
        </span>
      </label>
      <label className="choice-option text-sm">
        <input
          type="checkbox"
          checked={selection.categories ?? false}
          disabled={selection.expenses}
          onChange={handleCategories}
          className="choice-control"
        />
        <span>
          <span className="block font-medium">Categories</span>
          <span className="block text-[var(--muted)]">
            {selection.expenses ? "Required by selected expenses" : "All group categories"}
          </span>
        </span>
      </label>
      <label className="choice-option text-sm">
        <input
          type="checkbox"
          checked={selection.tags ?? false}
          onChange={handleTags}
          className="choice-control"
        />
        <span>
          <span className="block font-medium">Tags</span>
          <span className="block text-[var(--muted)]">
            All group tags; optional even when expenses are included
          </span>
        </span>
      </label>
      <label className="choice-option text-sm">
        <input
          type="checkbox"
          checked={selection.members ?? false}
          disabled={selection.expenses}
          onChange={handleMembers}
          className="choice-control"
        />
        <span>
          <span className="block font-medium">Members</span>
          <span className="block text-[var(--muted)]">
            {selection.expenses
              ? "Required by selected expenses"
              : "All members and their profiles"}
          </span>
        </span>
      </label>
      <label className="choice-option text-sm">
        <input
          type="checkbox"
          checked={selection.expenses ?? false}
          disabled={selection.attachments}
          onChange={handleExpenses}
          className="choice-control"
        />
        <span>
          <span className="block font-medium">Expenses</span>
          <span className="block text-[var(--muted)]">
            {selection.attachments
              ? "Required by selected receipt files"
              : "All expenses, splits, and recorded group payments"}
          </span>
        </span>
      </label>
      {attachmentCount > 0 && (
        <label className="choice-option text-sm">
          <input
            type="checkbox"
            checked={selection.attachments ?? false}
            onChange={handleAttachments}
            className="choice-control"
          />
          <span>
            <span className="block font-medium">Receipt attachments ({attachmentCount})</span>
            <span className="block text-[var(--muted)]">
              Selecting receipts requires ZIP format
            </span>
          </span>
        </label>
      )}

      <dialog
        ref={noticeDialogRef}
        aria-labelledby="dependency-heading"
        aria-describedby="dependency-description"
        onClose={() => setNotice(null)}
        className="m-auto w-[calc(100%-32px)] max-w-md overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-0 text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      >
        <div className="bg-[var(--brand-soft)] px-6 pb-6 pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--brand-ink)]">
            <Icon icon={Check} size={14} /> Export selection
          </span>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h4 id="dependency-heading" className="text-xl font-extrabold tracking-tight">
                Included automatically
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]">
                {notice === "receipts"
                  ? "Receipts need their expenses and the people and categories connected to them."
                  : "Expenses need their categories and members to make sense on the new device."}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--brand-ink)] shadow-sm">
              <Icon icon={notice === "receipts" ? Paperclip : ReceiptText} size={23} />
            </span>
          </div>
        </div>
        <div className="px-6 pb-6 pt-5">
          <p id="dependency-description" className="text-xs font-bold text-[var(--muted)]">
            Here’s what changed
          </p>
          <div
            role="group"
            aria-label="Included content"
            className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-3"
          >
            <div>
              <p className="text-xs font-bold text-[var(--muted)]">You selected</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="chip !bg-[var(--surface)]">
                  <Icon icon={notice === "receipts" ? Paperclip : ReceiptText} size={15} />
                  {notice === "receipts" ? "Receipts" : "Expenses"}
                </span>
              </div>
            </div>
            <div className="mt-3 border-t border-[var(--line)] pt-3">
              <p className="text-xs font-bold text-[var(--brand-ink)]">Added automatically</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {notice === "receipts" && (
                  <span className="chip !border-[var(--brand)] !bg-[var(--brand-soft)] !text-[var(--brand-ink)]">
                    <Icon icon={ReceiptText} size={15} /> Expenses
                  </span>
                )}
                <span className="chip !border-[var(--brand)] !bg-[var(--brand-soft)] !text-[var(--brand-ink)]">
                  <Icon icon={Shapes} size={15} /> Categories
                </span>
                <span className="chip !border-[var(--brand)] !bg-[var(--brand-soft)] !text-[var(--brand-ink)]">
                  <Icon icon={UsersRound} size={15} /> Members
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
            {notice === "receipts"
              ? "Expenses, categories and members stay selected while receipts are included."
              : "Categories and members stay selected while expenses are included."}
          </p>
          <button
            type="button"
            autoFocus
            onClick={handleCloseNotice}
            className="btn btn-primary mt-5 w-full"
          >
            Got it
          </button>
        </div>
      </dialog>
    </fieldset>
  );
};

export default ExportContentSelector;
