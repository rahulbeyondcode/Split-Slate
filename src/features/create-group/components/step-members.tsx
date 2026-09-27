import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import PersonEditor from "@/features/people/components/person-editor";

import { useStore } from "@/shared/configs/store";
import type { CreateGroupFormValues } from "@/features/create-group/helpers/schema";
import type { PersonEditorValues } from "@/features/people/helpers/schema";

import type { Person } from "@/shared/types/domain.types";

import Avatar from "@/shared/ui/avatar";

interface PropsType {
  showHeading?: boolean;
}

const StepMembers = ({ showHeading = true }: PropsType) => {
  const localUser = useStore((s) => s.localUser);
  const people = useStore((s) => s.people);
  const { control } = useFormContext<CreateGroupFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "members", keyName: "_key" });
  const [addingNew, setAddingNew] = useState(false);

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
    setAddingNew(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {showHeading && (
        <div>
          <h2 className="page-title mb-1">Who's coming along?</h2>
          <p className="text-sm text-gray-500">Optional — adding members can wait.</p>
        </div>
      )}

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
          <span className="shrink-0 rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)]">
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
              ×
            </button>
          </li>
        ))}
      </ul>

      {available.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="field-label">Add from your friends</p>
          <div className="flex flex-wrap gap-2">
            {available.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => handlePick(person)}
                className="chip"
              >
                <span>{person.icon}</span>
                <span>{person.name}</span>
                <span className="text-[var(--brand-ink)]">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {addingNew ? (
        <PersonEditor
          existingNames={existingNames}
          onSave={handleAddNew}
          onCancel={() => setAddingNew(false)}
          submitLabel="Add person"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-left text-sm text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand-ink)]"
        >
          <span>Add another member</span>
          <span aria-hidden="true" className="text-lg leading-none text-[var(--brand-ink)]">
            +
          </span>
        </button>
      )}
    </div>
  );
};

export default StepMembers;
