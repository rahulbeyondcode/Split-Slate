import { ArrowLeft, ArrowRight, RotateCcw, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { restoreFullBackup } from "@/features/import-export/store";
import {
  GroupTransferFileError,
  MAX_BACKUP_ZIP_BYTES,
  parseFullBackupZip,
} from "@/features/import-export/utils/full-backup";
import type { FullBackupSnapshot } from "@/features/import-export/utils/full-backup-schema";
import { useStore } from "@/shared/configs/store";

import Icon from "@/shared/ui/icon";
import StatusBanner from "@/shared/ui/status-banner";

const CONFIRM_SECONDS = 10;

const RestoreBackup = () => {
  const navigate = useNavigate();
  const init = useStore((state) => state.init);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [snapshot, setSnapshot] = useState<FullBackupSnapshot | null>(null);
  const [remaining, setRemaining] = useState(CONFIRM_SECONDS);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");
  const [groupFile, setGroupFile] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (snapshot && !dialog?.open) dialog?.showModal();
    if (!snapshot && dialog?.open) dialog.close();
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot) return undefined;
    const interval = window.setInterval(() => {
      setRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [snapshot]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setError("");
    setGroupFile(false);
    setLoading(true);
    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        throw new GroupTransferFileError("CSV is for group transfers, not app backups.");
      }
      if (!file.name.toLowerCase().endsWith(".zip")) throw new Error("Choose a .zip file.");
      if (file.size > MAX_BACKUP_ZIP_BYTES) throw new Error("This ZIP is too large to restore.");
      const parsed = await parseFullBackupZip(new Uint8Array(await file.arrayBuffer()));
      setRemaining(CONFIRM_SECONDS);
      setSnapshot(parsed);
    } catch (failure) {
      const isGroupFile = failure instanceof GroupTransferFileError;
      setGroupFile(isGroupFile);
      setError(
        isGroupFile
          ? file.name.toLowerCase().endsWith(".csv")
            ? "App backups are ZIP files, not CSV. If this is a group transfer, import it there."
            : "This ZIP is for one group, not your whole app."
          : failure instanceof Error && failure.message === "This ZIP is too large to restore."
            ? failure.message
            : "We couldn't read this as an app backup. Look for split-slate-backup-YYYY-MM-DD.zip from Settings, or try the original download if you renamed it.",
      );
    } finally {
      setLoading(false);
      input.value = "";
    }
  };
  const handleCancel = () => {
    dialogRef.current?.close();
    setSnapshot(null);
    setError("");
  };
  const handleBack = () => navigate(-1);
  const handleRestore = async () => {
    if (!snapshot || remaining > 0 || restoring) return;
    setRestoring(true);
    setError("");
    try {
      await restoreFullBackup(snapshot);
      localStorage.setItem("split-slate-theme", snapshot.data.theme);
      document.documentElement.dataset.theme = snapshot.data.theme;
      await init();
      navigate("/dashboard", { replace: true });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not restore this backup");
      setRestoring(false);
    }
  };

  return (
    <main className="page page-narrow flex flex-col gap-6">
      <button type="button" onClick={handleBack} className="page-back-link">
        <Icon icon={ArrowLeft} size={18} /> Back
      </button>
      <header>
        <p className="eyebrow mb-2">WHOLE-APP BACKUP</p>
        <h1 className="page-title">Restore SplitSlate</h1>
        <p className="soft-caption mt-2">
          Bring back your groups, contacts, expenses, receipts, and settings from one saved file.
        </p>
      </header>
      <label className="import-file-picker surface">
        <span className="import-file-icon" aria-hidden="true">
          <Icon icon={Upload} size={28} />
        </span>
        <span className="import-file-title">Choose your app backup</span>
        <span className="soft-caption">
          Look for split-slate-backup-YYYY-MM-DD.zip (unless you renamed it).
        </span>
        <input
          type="file"
          accept=".zip,application/zip"
          onChange={handleFile}
          disabled={loading || restoring}
          className="sr-only"
        />
      </label>
      {loading && <p role="status">Validating backup…</p>}
      {error && !snapshot && (
        <StatusBanner variant="error">
          <p className="status-banner-title font-bold">We couldn't use this file</p>
          <p className="mt-1">{error}</p>
          {groupFile && (
            <Link to="/import" className="btn btn-secondary status-banner-action mt-3">
              Go to Import group <Icon icon={ArrowRight} size={16} />
            </Link>
          )}
        </StatusBanner>
      )}
      <StatusBanner variant="warning">
        This backup ZIP is not encrypted. Keep it private and don't edit its contents.
      </StatusBanner>
      <dialog
        ref={dialogRef}
        aria-labelledby="restore-title"
        aria-describedby="restore-description"
        onCancel={(event) => {
          if (restoring) event.preventDefault();
          else handleCancel();
        }}
        onClose={() => {
          if (!restoring) setSnapshot(null);
        }}
        className="m-auto w-[calc(100%-32px)] max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex flex-col gap-4">
          <span className="text-[var(--negative)]">
            <Icon icon={RotateCcw} size={28} />
          </span>
          <h2 id="restore-title" className="section-title">
            Replace all SplitSlate data?
          </h2>
          <p id="restore-description" className="text-sm leading-relaxed">
            This will permanently remove your current SplitSlate data on this browser and replace it
            with the validated backup. It cannot be undone. Save a backup of the current data first
            if you might need it.
          </p>
          {snapshot && (
            <div className="rounded-2xl bg-[var(--surface-soft)] p-4 text-sm">
              <p className="font-semibold">Backup for {snapshot.data.localUser[0].name}</p>
              <p className="mt-1">
                {snapshot.data.groups.length} groups · {snapshot.data.people.length} contacts ·{" "}
                {snapshot.data.expenses.length} expenses · {snapshot.data.attachments.length}{" "}
                receipts
              </p>
            </div>
          )}
          {remaining > 0 && (
            <p role="status" className="soft-caption">
              Review this warning. Restore available in{" "}
              <strong className="tabular font-extrabold text-[var(--ink)]">
                {remaining} {remaining === 1 ? "second" : "seconds"}
              </strong>
              .
            </p>
          )}
          {error && <StatusBanner variant="error">{error}</StatusBanner>}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={restoring}
              onClick={handleCancel}
            >
              Keep current data
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={remaining > 0 || restoring}
              onClick={handleRestore}
            >
              {restoring ? "Restoring…" : "Replace and restore"}
            </button>
          </div>
        </div>
      </dialog>
    </main>
  );
};

export default RestoreBackup;
