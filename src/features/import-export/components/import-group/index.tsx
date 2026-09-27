import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import ImportReview from "@/features/import-export/components/import-review";

import { decodeTransferPayload } from "@/features/import-export/utils/export-link";
import { parseGroupTransferFile } from "@/features/import-export/utils/import-file";
import { useStore } from "@/shared/configs/store";

import type { GroupTransferSource } from "@/features/import-export/types/import-export.types";
import type { Group } from "@/shared/types/domain.types";

const ImportGroup = () => {
  const initialized = useStore((state) => state.initialized);
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [source, setSource] = useState<GroupTransferSource | null>(null);
  const [loading, setLoading] = useState(Boolean(hash));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hash) return undefined;
    let active = true;
    const loadLink = async () => {
      setLoading(true);
      setSource(null);
      setError("");
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
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      setSource(await parseGroupTransferFile(file));
    } catch (failure) {
      setSource(null);
      setError(failure instanceof Error ? failure.message : "Could not read this transfer file");
    } finally {
      setLoading(false);
      event.currentTarget.value = "";
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
            📦
          </div>
          <p className="import-panel-eyebrow">PICK UP WHERE YOU LEFT OFF</p>
          <h2>Bring your group along.</h2>
          <p>
            From someone else's device to yours. Your people and shared history, ready to keep
            going.
          </p>
        </div>
        <p className="import-panel-footnote">🔒 Your transfer stays on this device</p>
      </aside>

      <section className="import-main" aria-label="Import a group">
        <div className="import-content">
          {!initialized || loading ? (
            <div role="status" className="import-loading surface surface-pad">
              <span className="import-loading-icon" aria-hidden="true">
                📂
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
              <header>
                <p className="eyebrow mb-2">GROUP TRANSFER</p>
                <h1 className="page-title">Import a group</h1>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  Choose a SplitSlate CSV or ZIP file, or open a transfer link. Review what is
                  included before creating a new editable group on this device.
                </p>
              </header>

              {error && (
                <p role="alert" className="note money-negative">
                  {error}
                </p>
              )}

              <label className="import-file-picker surface">
                <span className="import-file-icon" aria-hidden="true">
                  ↑
                </span>
                <span className="import-file-title">Choose a transfer file</span>
                <span className="soft-caption">
                  SplitSlate CSV or ZIP · your data is checked first
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
              <Link to="/" className="btn btn-secondary self-start">
                ← Back to SplitSlate
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ImportGroup;
