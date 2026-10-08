import {
  ChevronRight,
  Download,
  LoaderCircle,
  LockKeyhole,
  MoonStar,
  Pencil,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import PersonEditor from "@/features/people/components/person-editor";
import OfflineIcons from "@/features/pwa/components/offline-icons";

import { readFullBackupSource } from "@/features/import-export/store";
import { downloadFile } from "@/features/import-export/utils/download-file";
import { createFullBackupZip } from "@/features/import-export/utils/full-backup";
import { useStore } from "@/shared/configs/store";

import { DEFAULT_PROFILE_EMOJI } from "@/shared/constants/emoji-catalog";

import { usePwa } from "@/app/providers/pwa-provider";
import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";
import StatusBanner from "@/shared/ui/status-banner";
import Surface from "@/shared/ui/surface";

const AppSettings = () => {
  const { localUser, groups, people, setLocalUser } = useStore();
  const { supported, openInstall } = usePwa();
  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const [dark, setDark] = useState(() => localStorage.getItem("split-slate-theme") === "dark");
  const [editing, setEditing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupError, setBackupError] = useState("");
  const handleBackup = async () => {
    setBackingUp(true);
    setBackupError("");
    try {
      const theme = localStorage.getItem("split-slate-theme") === "dark" ? "dark" : "light";
      const bytes = await createFullBackupZip(await readFullBackupSource(), theme);
      const fileName = `split-slate-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      downloadFile(Uint8Array.from(bytes).buffer, "application/zip", fileName);
    } catch (failure) {
      setBackupError(failure instanceof Error ? failure.message : "Could not create the backup");
    } finally {
      setBackingUp(false);
    }
  };
  const handleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("split-slate-theme", next ? "dark" : "light");
    document.documentElement.dataset.theme = next ? "dark" : "light";
  };
  return (
    <div className="page page-narrow mobile-sticky-page flex flex-col gap-5">
      <header>
        <h1 className="page-title">Settings</h1>
        <p className="soft-caption">App-level · everything stays on this device</p>
      </header>
      {editing ? (
        <PersonEditor
          initial={{ name: localUser?.name ?? "", icon: localUser?.icon ?? DEFAULT_PROFILE_EMOJI }}
          existingNames={people
            .filter((person) => person.id !== localUser?.id)
            .map((person) => person.name)}
          onSave={async (values) => {
            await setLocalUser(values.name, values.icon);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          submitLabel="Save changes"
        />
      ) : (
        <Surface className="surface-pad flex items-center gap-3">
          <Avatar icon={localUser?.icon} name={localUser?.name} />
          <div className="flex-1">
            <p className="font-bold">{localUser?.name}</p>
            <p className="soft-caption">Your identity · no account needed</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
            <Icon icon={Pencil} size={18} /> Edit
          </button>
        </Surface>
      )}
      <section>
        <p className="eyebrow mb-2">Appearance</p>
        <Surface className="surface-pad flex items-center gap-3">
          <span className="avatar avatar-square text-[var(--brand-ink)]">
            <Icon icon={MoonStar} size={26} />
          </span>
          <div className="flex-1">
            <p className="font-bold">Dark theme</p>
            <p className="soft-caption">
              {dark ? "On" : "Off"} — following your choice, not the system
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label="Dark theme"
            onClick={handleTheme}
            className={`relative h-7 w-12 rounded-full transition-colors ${dark ? "bg-[var(--brand)]" : "bg-[var(--line)]"}`}
          >
            <span
              className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${dark ? "translate-x-5" : ""}`}
            />
          </button>
        </Surface>
      </section>
      {supported && !installed && (
        <section>
          <p className="eyebrow mb-2">App installation</p>
          <Surface className="surface-pad flex flex-col items-start gap-3">
            <p className="soft-caption">
              Install Split Slate for quick access and offline use. If your browser cannot show an
              install prompt, you’ll see instructions instead.
            </p>
            <button type="button" className="btn btn-secondary" onClick={openInstall}>
              <Icon icon={Download} size={18} /> Install app
            </button>
          </Surface>
        </section>
      )}
      <OfflineIcons />
      <section>
        <p className="eyebrow mb-2">Group transfer</p>
        <Surface className="surface-pad flex flex-col gap-3">
          <p className="soft-caption">
            Import a group from a Split Slate Link, CSV, or ZIP without replacing your existing
            groups.
          </p>
          <Link
            to="/import"
            className="settings-data-action"
            aria-label="Import group"
            aria-describedby="import-group-description"
          >
            <span className="settings-data-action-icon" aria-hidden="true">
              <Icon icon={Upload} size={24} />
            </span>
            <span className="min-w-0">
              <span className="settings-data-action-title">Import group</span>
              <span id="import-group-description" className="soft-caption">
                Bring a shared or saved group.
              </span>
            </span>
          </Link>
        </Surface>
      </section>
      <section>
        <p className="eyebrow mb-2">Whole-app backup</p>
        <Surface className="surface-pad flex flex-col gap-3">
          <p className="soft-caption">
            Save all your groups, contacts, expenses, receipts, identity, and settings in one ZIP.
          </p>
          <StatusBanner variant="warning">
            The ZIP is not encrypted, so keep it private. Keep the downloaded file unchanged;
            editing it may prevent restore.
          </StatusBanner>
          <div className="settings-backup-actions" role="group" aria-label="App backup actions">
            <button
              type="button"
              className="settings-data-action"
              disabled={backingUp}
              onClick={handleBackup}
              aria-label={backingUp ? "Preparing app backup" : "Download app backup"}
              aria-describedby="download-backup-description"
              aria-busy={backingUp}
            >
              <span className="settings-data-action-icon" aria-hidden="true">
                <Icon
                  icon={backingUp ? LoaderCircle : Download}
                  size={24}
                  className={backingUp ? "animate-spin" : ""}
                />
              </span>
              <span className="min-w-0">
                <span className="settings-data-action-title">
                  {backingUp ? "Preparing…" : "Download app backup"}
                </span>
                <span id="download-backup-description" className="soft-caption">
                  Save a snapshot of everything.
                </span>
              </span>
            </button>
            <Link
              to="/restore"
              className="settings-data-action"
              aria-label="Restore app backup"
              aria-describedby="restore-backup-description"
            >
              <span className="settings-data-action-icon" aria-hidden="true">
                <Icon icon={RotateCcw} size={24} />
              </span>
              <span className="min-w-0">
                <span className="settings-data-action-title">Restore app backup</span>
                <span id="restore-backup-description" className="soft-caption">
                  Bring back a saved snapshot.
                </span>
              </span>
            </Link>
          </div>
          {backupError && <StatusBanner variant="error">{backupError}</StatusBanner>}
        </Surface>
      </section>
      <section>
        <p className="eyebrow mb-2">Group settings</p>
        <Surface className="px-5">
          {groups.map((group) => (
            <Link to={`/groups/${group.id}/settings`} className="ui-row" key={group.id}>
              <Avatar icon={group.icon} square />
              <span className="flex-1">
                <strong>{group.name}</strong>
                <span className="block soft-caption">export · details</span>
              </span>
              <Icon icon={ChevronRight} size={20} className="text-[var(--muted)]" />
            </Link>
          ))}
          {groups.length === 0 && <p className="py-5 muted">Your groups will appear here.</p>}
        </Surface>
      </section>
      <p className="note flex items-start gap-2">
        <Icon icon={LockKeyhole} size={18} />
        <span>
          No account or cloud sync is needed. Download an app backup, or export one group to share
          it.
        </span>
      </p>
    </div>
  );
};

export default AppSettings;
