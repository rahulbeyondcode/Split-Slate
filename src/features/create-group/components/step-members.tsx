import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import PersonEditor from "@/features/people/components/person-editor";

import { useStore } from "@/shared/configs/store";
import type { CreateGroupFormValues } from "@/features/create-group/helpers/schema";
import type { PersonEditorValues } from "@/features/people/helpers/schema";

import type { Person } from "@/shared/types/domain.types";

const StepMembers = () => {
  const localUser = useStore((s) => s.localUser);
  const people = useStore((s) => s.people);
  const { control } = useFormContext<CreateGroupFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "members", keyName: "_key" });
  const [addingNew, setAddingNew] = useState(false);

  const selectedPersonIds = new Set(
    fields.map((f) => f.personId).filter((id): id is string => Boolean(id)),
  );
  // Directory people available to add: not yourself, not already in the group.
  const available = people.filter((p) => p.id !== localUser?.id && !selectedPersonIds.has(p.id));
  const existingNames = [localUser?.name ?? "", ...fields.map((f) => f.name)];

  const handlePick = (person: Person) => {
    append({ personId: person.id, name: person.name, icon: person.icon });
  };

  const handleAddNew = (values: PersonEditorValues) => {
    append({ name: values.name, icon: values.icon });
    setAddingNew(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Add members</h2>
        <p className="text-sm text-gray-500">
          You're already in this group. Pick from your friends or add someone new — you can always
          add them later.
        </p>
      </div>

      {available.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Your friends
          </span>
          <div className="flex flex-wrap gap-2">
            {available.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => handlePick(person)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <span>{person.icon}</span>
                <span>{person.name}</span>
                <span className="text-gray-400">+</span>
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
          submitLabel="Add"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="px-4 py-2 text-sm border border-dashed border-gray-400 rounded text-gray-600"
        >
          + Add new person
        </button>
      )}

      <ul className="flex flex-col gap-2">
        <li className="flex items-center justify-between px-3 py-2 border rounded bg-gray-50">
          <span className="text-sm">
            {localUser?.icon} {localUser?.name}
          </span>
          <span className="text-xs text-gray-400">You</span>
        </li>
        {fields.map((f, i) => (
          <li key={f._key} className="flex items-center justify-between px-3 py-2 border rounded">
            <span className="text-sm">
              {f.icon} {f.name}
            </span>
            <button type="button" onClick={() => remove(i)} className="text-xs text-red-500">
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StepMembers;
