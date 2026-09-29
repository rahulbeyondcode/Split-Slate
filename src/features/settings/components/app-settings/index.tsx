import { ChevronRight, LockKeyhole, MoonStar, Pencil } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import PersonEditor from "@/features/people/components/person-editor";

import { useStore } from "@/shared/configs/store";

import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

const AppSettings = () => {
  const { localUser, groups, people, setLocalUser } = useStore();
  const [dark, setDark] = useState(() => localStorage.getItem("split-slate-theme") === "dark");
  const [editing, setEditing] = useState(false);
  const handleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("split-slate-theme", next ? "dark" : "light");
    document.documentElement.dataset.theme = next ? "dark" : "light";
  };
  return (
    <div className="page page-narrow flex flex-col gap-5">
      <header>
        <h1 className="page-title">Settings</h1>
        <p className="soft-caption">App-level · everything stays on this device</p>
      </header>
      {editing ? (
        <PersonEditor
          initial={{ name: localUser?.name ?? "", icon: localUser?.icon ?? "🦊" }}
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
      <section>
        <p className="eyebrow mb-2">Group settings</p>
        <Surface className="px-5">
          {groups.map((group) => (
            <Link to={`/groups/${group.id}/settings`} className="ui-row" key={group.id}>
              <Avatar icon={group.icon} square />
              <span className="flex-1">
                <strong>{group.name}</strong>
                <span className="block soft-caption">export · import · details</span>
              </span>
              <Icon icon={ChevronRight} size={20} className="text-[var(--muted)]" />
            </Link>
          ))}
          {groups.length === 0 && <p className="py-5 muted">Your groups will appear here.</p>}
        </Surface>
      </section>
      <p className="note flex items-start gap-2">
        <Icon icon={LockKeyhole} size={18} />
        <span>No accounts or cloud sync. Export a group anytime to move or back it up.</span>
      </p>
    </div>
  );
};

export default AppSettings;
