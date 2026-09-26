import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import ExportContentSelector from "@/features/import-export/components/export-content-selector";

import { readGroupExportSource } from "@/features/import-export/store";
import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import { downloadFile, exportFileName } from "@/features/import-export/utils/download-file";
import { createPortableGroupCsv } from "@/features/import-export/utils/export-csv";
import {
  createTransferLink,
  TransferLinkTooLargeError,
} from "@/features/import-export/utils/export-link";
import { createPortableGroupZip } from "@/features/import-export/utils/export-zip";
import { transferSelectionSchema } from "@/features/import-export/utils/portable-group-schema";

import type { TransferSelection } from "@/features/import-export/types/import-export.types";

interface PropsType {
  groupId: string;
  groupName: string;
  attachmentCount: number;
}

type ExportOperation = "link" | "csv" | "zip" | "copy" | null;

interface GeneratedLink {
  selectionKey: string;
  value: string;
}

const DEFAULT_SELECTION: TransferSelection = {
  categories: false,
  tags: false,
  members: false,
  expenses: false,
  attachments: false,
};

const ExportPanel = ({ groupId, groupName, attachmentCount }: PropsType) => {
  const methods = useForm<TransferSelection>({
    resolver: zodResolver(transferSelectionSchema),
    defaultValues: DEFAULT_SELECTION,
  });
  const [categoriesSelected, tagsSelected, membersSelected, expensesSelected, attachmentsSelected] =
    useWatch({
      control: methods.control,
      name: ["categories", "tags", "members", "expenses", "attachments"],
    });
  const [operation, setOperation] = useState<ExportOperation>(null);
  const [transferLink, setTransferLink] = useState<GeneratedLink | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const currentSelectionKey = JSON.stringify([
    categoriesSelected,
    tagsSelected,
    membersSelected,
    expensesSelected,
    attachmentsSelected,
  ]);

  const startOperation = (next: ExportOperation) => {
    setOperation(next);
    setMessage("");
    setError("");
  };

  const finishWithError = (failure: unknown) => {
    setError(failure instanceof Error ? failure.message : "Could not export this group");
    setOperation(null);
  };

  const prepareTransfer = async () => {
    const valid = await methods.trigger();
    if (!valid) throw new Error("Choose a valid set of group content");
    const selection = methods.getValues();
    const source = await readGroupExportSource(groupId);
    return { source: await buildGroupTransfer(source, selection), selection };
  };

  const handleCreateLink = async () => {
    startOperation("link");
    setTransferLink(null);
    try {
      const { selection, source } = await prepareTransfer();
      const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
      setTransferLink({
        selectionKey: JSON.stringify(Object.values(selection)),
        value: await createTransferLink(source.bundle, appBaseUrl),
      });
      setMessage(
        "Transfer link ready. The recipient can import a new editable copy of this group.",
      );
      setOperation(null);
    } catch (failure) {
      if (failure instanceof TransferLinkTooLargeError) {
        setMessage(
          "This selection is too large for a supported transfer link. Download CSV or ZIP instead.",
        );
        setOperation(null);
        return;
      }
      finishWithError(failure);
    }
  };

  const handleCopyLink = async () => {
    if (!transferLink || transferLink.selectionKey !== currentSelectionKey) return;
    startOperation("copy");
    try {
      await navigator.clipboard.writeText(transferLink.value);
      setMessage("Transfer link copied.");
      setOperation(null);
    } catch {
      setError("Could not copy automatically. Select and copy the link below.");
      setOperation(null);
    }
  };

  const handleDownloadCsv = async () => {
    startOperation("csv");
    try {
      const { source } = await prepareTransfer();
      downloadFile(
        await createPortableGroupCsv(source.bundle),
        "text/csv;charset=utf-8",
        exportFileName(groupName, "csv"),
      );
      setMessage("CSV downloaded. Receipt files are not included.");
      setOperation(null);
    } catch (failure) {
      finishWithError(failure);
    }
  };

  const handleDownloadZip = async () => {
    startOperation("zip");
    try {
      const { source } = await prepareTransfer();
      const archive = await createPortableGroupZip(source);
      downloadFile(
        archive.buffer as ArrayBuffer,
        "application/zip",
        exportFileName(groupName, "zip"),
      );
      setMessage(
        source.bundle.attachments.length
          ? "ZIP downloaded with all selected receipt files."
          : "ZIP downloaded. No receipt files were selected.",
      );
      setOperation(null);
    } catch (failure) {
      finishWithError(failure);
    }
  };

  const busy = operation !== null;

  return (
    <FormProvider {...methods}>
      <section aria-labelledby="export-heading" className="flex flex-col gap-4">
        <div>
          <h3 id="export-heading" className="text-lg font-semibold text-gray-900">
            Transfer group
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Create an independent editable copy of selected group data on another device.
          </p>
        </div>

        <ExportContentSelector attachmentCount={attachmentCount} />

        {error && (
          <p role="alert" className="rounded border border-red-300 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded border border-blue-200 p-3 text-sm text-blue-800">
            {message}
          </p>
        )}
        {attachmentsSelected && (
          <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Receipt files cannot be embedded in Link or CSV transfers. ZIP is required for the
            selected receipts.
          </p>
        )}

        <div className="grid gap-3 lg:grid-cols-3">
          <article className="flex flex-col gap-3 rounded border border-gray-200 p-4">
            <div>
              <h4 className="font-semibold">Transfer link</h4>
              <p className="mt-1 text-sm text-gray-600">
                Available up to 32,000 characters for current major browsers. If a messaging app
                cannot carry the link, use CSV or ZIP.
              </p>
              <p className="mt-2 text-xs text-amber-800">
                Anyone holding this unencrypted link can decode the selected group data.
              </p>
            </div>
            <button
              type="button"
              disabled={busy || attachmentsSelected}
              onClick={handleCreateLink}
              className="mt-auto rounded bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {operation === "link" ? "Creating…" : "Create transfer link"}
            </button>
          </article>

          <article className="flex flex-col gap-3 rounded border border-gray-200 p-4">
            <div>
              <h4 className="font-semibold">CSV file</h4>
              <p className="mt-1 text-sm text-gray-600">
                A validated typed-data transfer without receipt files.
              </p>
            </div>
            <button
              type="button"
              disabled={busy || attachmentsSelected}
              onClick={handleDownloadCsv}
              className="mt-auto rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-60"
            >
              {operation === "csv" ? "Preparing…" : "Download CSV"}
            </button>
          </article>

          <article className="flex flex-col gap-3 rounded border border-gray-200 p-4">
            <div>
              <h4 className="font-semibold">ZIP file</h4>
              <p className="mt-1 text-sm text-gray-600">
                Always available and includes receipt files when they are selected.
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleDownloadZip}
              className="mt-auto rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-60"
            >
              {operation === "zip" ? "Preparing…" : "Download ZIP"}
            </button>
          </article>
        </div>

        {transferLink?.selectionKey === currentSelectionKey && (
          <div className="flex flex-col gap-2 rounded border border-gray-200 p-4">
            <label htmlFor="transfer-link" className="text-sm font-medium">
              Transfer link
            </label>
            <input
              id="transfer-link"
              readOnly
              value={transferLink.value}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              onClick={handleCopyLink}
              className="self-start rounded border border-gray-300 px-4 py-2 text-sm disabled:opacity-60"
            >
              {operation === "copy" ? "Copying…" : "Copy link"}
            </button>
          </div>
        )}
      </section>
    </FormProvider>
  );
};

export default ExportPanel;
