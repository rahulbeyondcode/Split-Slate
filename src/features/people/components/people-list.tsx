import { useState } from "react";

import PersonEditor from "@/features/people/components/person-editor";

import { useStore } from "@/shared/configs/store";
import type { PersonEditorValues } from "@/features/people/helpers/schema";

type EditorMode = { type: "add" } | { type: "edit"; id: string } | null;

const PeopleList = () => {
  const { localUser, people, addPerson, updatePerson, removePerson, setLocalUser } = useStore();
  const [mode, setMode] = useState<EditorMode>(null);
  const [error, setError] = useState<string | null>(null);

  const namesExcept = (id?: string) =>
    people.filter((person) => person.id !== id).map((person) => person.name);

  const handleAdd = async (values: PersonEditorValues) => {
    await addPerson(values.name, values.icon);
    setMode(null);
  };

  const handleEdit = (id: string) => async (values: PersonEditorValues) => {
    // The self person stays in sync with the local user identity.
    if (id === localUser?.id) await setLocalUser(values.name, values.icon);
    else await updatePerson(id, values);
    setMode(null);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await removePerson(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this person");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Friends</h1>
          <p className="text-sm text-gray-500">People you split expenses with</p>
        </div>
        {mode?.type !== "add" && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode({ type: "add" });
            }}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded shrink-0"
          >
            + Add a friend
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {mode?.type === "add" && (
        <PersonEditor
          existingNames={namesExcept()}
          onSave={handleAdd}
          onCancel={() => setMode(null)}
          submitLabel="Add"
        />
      )}

      <ul className="flex flex-col gap-2">
        {people.map((person) =>
          mode?.type === "edit" && mode.id === person.id ? (
            <li key={person.id}>
              <PersonEditor
                existingNames={namesExcept(person.id)}
                initial={{ name: person.name, icon: person.icon }}
                onSave={handleEdit(person.id)}
                onCancel={() => setMode(null)}
              />
            </li>
          ) : (
            <li
              key={person.id}
              className="flex items-center justify-between px-3 py-2 border rounded"
            >
              <span className="text-sm">
                {person.icon} {person.name}
                {person.id === localUser?.id && (
                  <span className="ml-2 text-xs text-gray-400">You</span>
                )}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode({ type: "edit", id: person.id });
                  }}
                  className="text-xs text-gray-600"
                >
                  Edit
                </button>
                {person.id !== localUser?.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(person.id)}
                    className="text-xs text-red-500"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
};

export default PeopleList;
