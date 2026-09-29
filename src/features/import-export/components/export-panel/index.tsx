import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

import Icon from "@/shared/ui/icon";

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

interface LinkAvailability {
  selectionKey: string;
  status: "available" | "too-large" | "unknown";
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
  const getValues = methods.getValues;
  const [categoriesSelected, tagsSelected, membersSelected, expensesSelected, attachmentsSelected] =
    useWatch({
      control: methods.control,
      name: ["categories", "tags", "members", "expenses", "attachments"],
    });
  const [operation, setOperation] = useState<ExportOperation>(null);
  const [transferLink, setTransferLink] = useState<GeneratedLink | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [linkAvailability, setLinkAvailability] = useState<LinkAvailability | null>(null);
  const [linkDialogReason, setLinkDialogReason] = useState<"size" | "receipts" | null>(null);
  const linkDialogRef = useRef<HTMLDialogElement>(null);
  const currentSelectionKey = JSON.stringify([
    categoriesSelected,
    tagsSelected,
    membersSelected,
    expensesSelected,
    attachmentsSelected,
  ]);
  const linkStatus =
    linkAvailability?.selectionKey === currentSelectionKey ? linkAvailability.status : "unknown";
  const linkUnavailable = attachmentsSelected || linkStatus === "too-large";

  useEffect(() => {
    if (attachmentsSelected) return undefined;
    let active = true;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const source = await readGroupExportSource(groupId);
          const transfer = await buildGroupTransfer(source, getValues());
          const appBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
          await createTransferLink(transfer.bundle, appBaseUrl);
          if (active)
            setLinkAvailability({ selectionKey: currentSelectionKey, status: "available" });
        } catch (failure) {
          if (active) {
            setLinkAvailability({
              selectionKey: currentSelectionKey,
              status: failure instanceof TransferLinkTooLargeError ? "too-large" : "unknown",
            });
          }
        }
      })();
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [attachmentsSelected, currentSelectionKey, getValues, groupId]);

  useEffect(() => {
    const dialog = linkDialogRef.current;
    if (linkDialogReason && !dialog?.open) dialog?.showModal();
    if (!linkDialogReason && dialog?.open) dialog.close();
  }, [linkDialogReason]);

  const handleCloseLinkDialog = () => {
    linkDialogRef.current?.close();
    setLinkDialogReason(null);
  };

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
        setLinkAvailability({ selectionKey: currentSelectionKey, status: "too-large" });
        setLinkDialogReason("size");
        setOperation(null);
        return;
      }
      finishWithError(failure);
    }
  };

  const handleLinkClick = () => {
    if (attachmentsSelected) {
      setLinkDialogReason("receipts");
      return;
    }
    if (linkStatus === "too-large") {
      setLinkDialogReason("size");
      return;
    }
    void handleCreateLink();
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
          <h3 id="export-heading" className="section-title">
            Export group
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
          <article className="surface surface-pad flex flex-col gap-3">
            <div>
              <h4 className="font-semibold">Transfer link</h4>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Share the selected group content with another device. For larger transfers, use a
                file instead.
              </p>
              <p className="mt-2 text-xs text-[var(--negative)]">
                Anyone holding this unencrypted link can decode the selected group data.
              </p>
              {linkUnavailable && (
                <p
                  id="link-unavailable-hint"
                  className="mt-2 text-xs font-semibold text-[var(--muted)]"
                >
                  {attachmentsSelected
                    ? "Receipt files need a ZIP transfer. Select the button to learn more."
                    : "Too much selected for a link. Select the button to see your options."}
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={busy}
              data-unavailable={linkUnavailable}
              aria-describedby={linkUnavailable ? "link-unavailable-hint" : undefined}
              onClick={handleLinkClick}
              className={`btn mt-auto ${linkUnavailable ? "btn-blocked" : "btn-primary"}`}
            >
              {operation === "link" ? "Creating…" : "Create transfer link"}
            </button>
          </article>

          <article className="surface surface-pad flex flex-col gap-3">
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
              className="btn btn-secondary mt-auto"
            >
              {operation === "csv" ? "Preparing…" : "Download CSV"}
            </button>
          </article>

          <article className="surface surface-pad flex flex-col gap-3">
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
              className="btn btn-secondary mt-auto"
            >
              {operation === "zip" ? "Preparing…" : "Download ZIP"}
            </button>
          </article>
        </div>

        {transferLink?.selectionKey === currentSelectionKey && !linkUnavailable && (
          <div className="flex flex-col gap-2 rounded border border-gray-200 p-4">
            <label htmlFor="transfer-link" className="text-sm font-medium">
              Transfer link
            </label>
            <input
              id="transfer-link"
              readOnly
              value={transferLink.value}
              onFocus={(event) => event.currentTarget.select()}
              className="form-input min-w-0"
            />
            <button
              type="button"
              disabled={busy}
              onClick={handleCopyLink}
              className="btn btn-secondary self-start"
            >
              {operation === "copy" ? "Copying…" : "Copy link"}
            </button>
          </div>
        )}
        <dialog
          ref={linkDialogRef}
          aria-labelledby="link-unavailable-title"
          aria-describedby="link-unavailable-description"
          onClose={() => setLinkDialogReason(null)}
          className="m-auto w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-ink)]">
              <Icon icon={Info} size={26} />
            </span>
            <div>
              <h2 id="link-unavailable-title" className="text-xl font-bold">
                Transfer link unavailable
              </h2>
              <p id="link-unavailable-description" className="mt-2 text-sm leading-relaxed">
                {linkDialogReason === "receipts"
                  ? "Links cannot carry receipt files. Download ZIP to include them, or deselect receipt files to use a link."
                  : "There is too much selected for a reliable link. Download CSV or ZIP instead, or select less content and try again."}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              autoFocus
              onClick={handleCloseLinkDialog}
              className="btn btn-primary"
            >
              Got it
            </button>
          </div>
        </dialog>
      </section>
    </FormProvider>
  );
};

export default ExportPanel;
