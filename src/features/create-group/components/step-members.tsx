import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import PersonEditor from "@/features/people/components/person-editor";

import { useStore } from "@/shared/configs/store";
import type { CreateGroupFormValues } from "@/features/create-group/helpers/schema";
import type { PersonEditorValues } from "@/features/people/helpers/schema";

import type { Person } from "@/shared/types/domain.types";

import Avatar from "@/shared/ui/avatar";
import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";
import MobileEditorDialog from "@/shared/ui/mobile-editor-dialog";

interface PropsType {
  showHeading?: boolean;
  onEditorOpenChange?: (open: boolean) => void;
}

const StepMembers = ({ showHeading = true, onEditorOpenChange }: PropsType) => {
  const localUser = useStore((s) => s.localUser);
  const people = useStore((s) => s.people);
  const { control } = useFormContext<CreateGroupFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "members", keyName: "_key" });
  const [addingNew, setAddingNew] = useState(false);
  const addPersonButtonRef = useRef<HTMLButtonElement>(null);

  const selectedPersonIds = new Set(
    fields.map((f) => f.personId).filter((id): id is string => Boolean(id)),
  );
  // Directory people available to add: not yourself, not already in the group.
  const available = people
    .filter((p) => p.id !== localUser?.id && !selectedPersonIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const sortedFields = fields
    .map((member, index) => ({ member, index }))
    .sort((a, b) => a.member.name.localeCompare(b.member.name, undefined, { sensitivity: "base" }));
  const existingNames = [localUser?.name ?? "", ...fields.map((f) => f.name)];

  const handlePick = (person: Person) => {
    append({ personId: person.id, name: person.name, icon: person.icon });
  };

  const handleAddNew = (values: PersonEditorValues) => {
    append({ name: values.name, icon: values.icon });
    handleCancelEditor();
  };

  const handleOpenEditor = () => {
    setAddingNew(true);
    onEditorOpenChange?.(true);
  };

  const handleCancelEditor = () => {
    setAddingNew(false);
    onEditorOpenChange?.(false);
    requestAnimationFrame(() => addPersonButtonRef.current?.focus());
  };

  const memberList = (
    <ul className="surface overflow-hidden px-4 sm:px-5" aria-label="Group members">
      <li className="flex min-w-0 items-center gap-3 border-b border-[var(--line)] py-3">
        <Avatar icon={localUser?.icon} name={localUser?.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {localUser?.name ?? "You"}{" "}
            <span className="font-medium text-[var(--muted)]">(you)</span>
          </p>
          <p className="soft-caption">Group creator</p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[0.625rem] font-semibold text-[var(--muted)]">
          Auto-added
        </span>
      </li>
      {sortedFields.map(({ member, index }) => (
        <li
          key={member._key}
          className="flex min-w-0 items-center gap-3 border-b border-[var(--line)] py-3 last:border-0"
        >
          <Avatar icon={member.icon} name={member.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{member.name}</p>
            <p className="soft-caption">{member.id ? "Already in group" : "Ready to add"}</p>
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label={`Remove ${member.name} from group`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-[var(--muted)] hover:bg-[var(--negative-soft)] hover:text-[var(--negative)]"
          >
            <Icon icon={X} size={19} />
          </button>
        </li>
      ))}
    </ul>
  );

  const friendPicker = available.length > 0 && (
    <div className="flex flex-col gap-2">
      <p className="field-label">Add from your friends</p>
      <div className="flex flex-wrap gap-2">
        {available.map((person) => (
          <button key={person.id} type="button" onClick={() => handlePick(person)} className="chip">
            <EmojiImage icon={person.icon} kind="profile" />
            <span>{person.name}</span>
            <Icon icon={Plus} size={17} className="text-[var(--brand-ink)]" />
          </button>
        ))}
      </div>
    </div>
  );

  const addPersonButton = (
    <button
      ref={addPersonButtonRef}
      type="button"
      onClick={handleOpenEditor}
      aria-haspopup="dialog"
      className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-[var(--brand)] bg-[var(--brand-soft)] px-4 py-2.5 text-left text-[var(--brand-ink)] transition-colors hover:border-[var(--brand-ink)] hover:bg-[var(--surface)]"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]"
      >
        <Icon icon={Plus} size={20} />
      </span>
      <span className="font-bold">Add another member</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {showHeading && (
        <div>
          <h2 className="page-title mb-1">Who's coming along?</h2>
          <p className="text-sm text-gray-500">Optional — adding members can wait.</p>
        </div>
      )}
      {showHeading ? (
        <>
          {memberList}
          {friendPicker}
          {addPersonButton}
        </>
      ) : (
        <>
          {addPersonButton}
          {friendPicker}
          {memberList}
        </>
      )}
      {addingNew && (
        <MobileEditorDialog title="Add a person" onCancel={handleCancelEditor}>
          <PersonEditor
            existingNames={existingNames}
            onSave={handleAddNew}
            onCancel={handleCancelEditor}
            submitLabel="Add person"
            inDialog
          />
        </MobileEditorDialog>
      )}
    </div>
  );
};

export default StepMembers;
