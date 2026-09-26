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

  if (!initialized || loading) {
    return (
      <main className="page page-narrow" role="status">
        Validating transfer…
      </main>
    );
  }

  return (
    <main className="page page-narrow flex min-h-svh flex-col gap-6">
      {source ? (
        <ImportReview source={source} onImported={handleImported} />
      ) : (
        <>
          <header>
            <h1 className="page-title">Import a group</h1>
            <p className="mt-2 text-sm text-gray-600">
              Choose a Split Slate CSV or ZIP transfer file. Nothing is written until you review the
              counts and press Import group.
            </p>
          </header>
          {error && (
            <p role="alert" className="rounded border border-red-300 p-4 text-red-700">
              {error}
            </p>
          )}
          <label className="surface surface-pad flex cursor-pointer flex-col gap-2 border-dashed text-center">
            <span className="font-medium">Choose CSV or ZIP</span>
            <input
              type="file"
              accept=".csv,.zip,text/csv,application/zip"
              onChange={handleFile}
              className="mx-auto text-sm"
            />
          </label>
          <Link to="/" className="btn btn-secondary self-start">
            Back to Split Slate
          </Link>
        </>
      )}
    </main>
  );
};

export default ImportGroup;
