import { ArrowLeft, ArrowRight, FolderOpen, LockKeyhole, PackageOpen, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import ImportReview from "@/features/import-export/components/import-review";

import { decodeTransferPayload } from "@/features/import-export/utils/export-link";
import { AppBackupFileError } from "@/features/import-export/utils/export-zip";
import { parseGroupTransferFile } from "@/features/import-export/utils/import-file";
import { useStore } from "@/shared/configs/store";

import type { GroupTransferSource } from "@/features/import-export/types/import-export.types";
import type { Group } from "@/shared/types/domain.types";

import Icon from "@/shared/ui/icon";
import StatusBanner from "@/shared/ui/status-banner";

const ImportGroup = () => {
  const initialized = useStore((state) => state.initialized);
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [source, setSource] = useState<GroupTransferSource | null>(null);
  const [loading, setLoading] = useState(Boolean(hash));
  const [error, setError] = useState("");
  const [appBackupFile, setAppBackupFile] = useState(false);

  useEffect(() => {
    if (!hash) return undefined;
    let active = true;
    const loadLink = async () => {
      setLoading(true);
      setSource(null);
      setError("");
      setAppBackupFile(false);
      try {
        const bundle = await decodeTransferPayload(hash);
        if (active) setSource({ bundle, attachmentFiles: [] });
      } catch (failure) {
        if (active) {
          setError(
            failure instanceof Error ? failure.message : "Could not open this transfer link",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadLink();
    return () => {
      active = false;
    };
  }, [hash]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setAppBackupFile(false);
    try {
      setSource(await parseGroupTransferFile(file));
    } catch (failure) {
      setSource(null);
      const isAppBackup = failure instanceof AppBackupFileError;
      setAppBackupFile(isAppBackup);
      setError(
        isAppBackup
          ? "This file backs up the whole app, not just one group."
          : "We couldn't read this as a group transfer. Look for a group ZIP or CSV downloaded from Export group; if you edited the file, try the original download.",
      );
    } finally {
      setLoading(false);
      input.value = "";
    }
  };

  const handleImported = (group: Group) => {
    navigate(`/groups/${group.id}`, { replace: true });
  };

  return (
    <main className="import-layout">
      <aside className="import-panel" aria-label="About group import">
        <div className="intro-brand">
          <span className="intro-brand-mark" aria-hidden="true" />
          <span>SplitSlate</span>
        </div>
        <div className="import-panel-story">
          <div className="import-panel-icon" aria-hidden="true">
            <Icon icon={PackageOpen} size={54} />
          </div>
          <p className="import-panel-eyebrow">PICK UP WHERE YOU LEFT OFF</p>
          <h2>Bring your group along.</h2>
          <p>Bring a group from another device—yours or someone else’s—and keep going here.</p>
        </div>
        <p className="import-panel-footnote flex items-center gap-2">
          <Icon icon={LockKeyhole} size={17} /> Your transfer stays on this device
        </p>
      </aside>

      <section className="import-main" aria-label="Import a group">
        <div className="import-content">
          {!initialized || loading ? (
            <div role="status" className="import-loading surface surface-pad">
              <span className="import-loading-icon" aria-hidden="true">
                <Icon icon={FolderOpen} size={40} />
              </span>
              <h1 className="section-title">Validating transfer…</h1>
              <p className="soft-caption">
                Checking the group and its contents before anything is saved.
              </p>
            </div>
          ) : source ? (
            <ImportReview source={source} onImported={handleImported} />
          ) : (
            <div className="flex flex-col gap-6">
              <Link to="/" className="page-back-link">
                <Icon icon={ArrowLeft} size={18} /> Back to SplitSlate
              </Link>
              <header>
                <p className="eyebrow mb-2">GROUP TRANSFER</p>
                <h1 className="page-title">Import a group</h1>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  Choose a SplitSlate CSV or ZIP file, or open a transfer link. Review what is
                  included before creating a new editable group on this device.
                </p>
              </header>

              {error && (
                <StatusBanner variant="error">
                  <p className="status-banner-title font-bold">We couldn't open this transfer</p>
                  <p className="mt-1">{error}</p>
                  {appBackupFile && (
                    <Link to="/restore" className="btn btn-secondary status-banner-action mt-3">
                      Go to Restore app backup <Icon icon={ArrowRight} size={16} />
                    </Link>
                  )}
                </StatusBanner>
              )}

              <label className="import-file-picker surface">
                <span className="import-file-icon" aria-hidden="true">
                  <Icon icon={Upload} size={28} />
                </span>
                <span className="import-file-title">Choose your group transfer</span>
                <span className="soft-caption">
                  Look for your-group-name.zip or your-group-name.csv (unless you renamed it).
                </span>
                <input
                  type="file"
                  accept=".csv,.zip,text/csv,application/zip"
                  onChange={handleFile}
                  className="sr-only"
                />
              </label>

              <p className="soft-caption">
                Nothing is added to your device until you review the transfer and press Import
                group.
              </p>
              <StatusBanner variant="warning">
                Keep downloaded ZIP or CSV files unchanged so they can be imported.
              </StatusBanner>
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="soft-caption">Have a ZIP containing all your groups?</p>
                <Link to="/restore" className="import-restore-link">
                  Restore the whole app instead. <Icon icon={ArrowRight} size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ImportGroup;
