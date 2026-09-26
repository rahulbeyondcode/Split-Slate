import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { TransferSelection } from "@/features/import-export/types/import-export.types";

interface PropsType {
  attachmentCount: number;
}

const ExportContentSelector = ({ attachmentCount }: PropsType) => {
  const { control, setValue } = useFormContext<TransferSelection>();
  const selection = useWatch({ control });
  const [notice, setNotice] = useState("");

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
      setNotice("Expenses reference categories and members, so both have been included.");
    }
  };
  const handleAttachments = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;
    setChecked("attachments", checked);
    if (checked) {
      setChecked("expenses", true);
      setChecked("categories", true);
      setChecked("members", true);
      setNotice(
        "Receipt files belong to expenses, so expenses, categories, and members have been included.",
      );
    }
  };
  const handleCloseNotice = () => setNotice("");

  return (
    <fieldset className="flex flex-col gap-3 rounded border border-gray-200 p-4">
      <legend className="px-1 font-semibold">Choose content</legend>
      <p className="text-sm text-gray-600">
        Only group information is selected initially. Choose every additional section you want on
        the new device.
      </p>

      <label className="flex items-start gap-3 rounded bg-gray-50 p-3 text-sm">
        <input type="checkbox" checked disabled className="mt-0.5" />
        <span>
          <span className="block font-medium">Group information</span>
          <span className="text-gray-600">
            Name, icon, currency, and creation details (required)
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded border border-gray-200 p-3 text-sm">
        <input
          type="checkbox"
          checked={selection.categories ?? false}
          disabled={selection.expenses}
          onChange={handleCategories}
          className="mt-0.5"
        />
        <span>
          <span className="block font-medium">Categories</span>
          <span className="text-gray-600">
            {selection.expenses ? "Required by selected expenses" : "All group categories"}
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded border border-gray-200 p-3 text-sm">
        <input
          type="checkbox"
          checked={selection.tags ?? false}
          onChange={handleTags}
          className="mt-0.5"
        />
        <span>
          <span className="block font-medium">Tags</span>
          <span className="text-gray-600">
            All group tags; optional even when expenses are included
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded border border-gray-200 p-3 text-sm">
        <input
          type="checkbox"
          checked={selection.members ?? false}
          disabled={selection.expenses}
          onChange={handleMembers}
          className="mt-0.5"
        />
        <span>
          <span className="block font-medium">Members</span>
          <span className="text-gray-600">
            {selection.expenses
              ? "Required by selected expenses"
              : "All members and their profiles"}
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 rounded border border-gray-200 p-3 text-sm">
        <input
          type="checkbox"
          checked={selection.expenses ?? false}
          disabled={selection.attachments}
          onChange={handleExpenses}
          className="mt-0.5"
        />
        <span>
          <span className="block font-medium">Expenses</span>
          <span className="text-gray-600">
            {selection.attachments
              ? "Required by selected receipt files"
              : "All expenses, splits, and payment allocations"}
          </span>
        </span>
      </label>
      {attachmentCount > 0 && (
        <label className="flex items-start gap-3 rounded border border-gray-200 p-3 text-sm">
          <input
            type="checkbox"
            checked={selection.attachments ?? false}
            onChange={handleAttachments}
            className="mt-0.5"
          />
          <span>
            <span className="block font-medium">Receipt attachments ({attachmentCount})</span>
            <span className="text-gray-600">Selecting receipts requires ZIP format</span>
          </span>
        </label>
      )}

      {notice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dependency-heading"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
        >
          <div className="w-full max-w-sm rounded bg-white p-5 shadow-xl">
            <h4 id="dependency-heading" className="font-semibold">
              Related content included
            </h4>
            <p className="mt-2 text-sm text-gray-600">{notice}</p>
            <button
              type="button"
              onClick={handleCloseNotice}
              className="mt-4 rounded bg-gray-900 px-4 py-2 text-sm text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
};

export default ExportContentSelector;
