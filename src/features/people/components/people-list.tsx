import { useState } from "react";
import { Link } from "react-router-dom";

import PersonEditor from "@/features/people/components/person-editor";

import { useStore } from "@/shared/configs/store";
import { calculateMemberNet } from "@/shared/utils/balances";
import type { PersonEditorValues } from "@/features/people/helpers/schema";

import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Surface from "@/shared/ui/surface";

type EditorMode = { type: "add" } | { type: "edit"; id: string } | null;

const PeopleList = () => {
  const {
    localUser,
    people,
    groups,
    members,
    expenses,
    addPerson,
    updatePerson,
    removePerson,
    setLocalUser,
  } = useStore();
  const [mode, setMode] = useState<EditorMode>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const namesExcept = (id?: string) =>
    people.filter((person) => person.id !== id).map((person) => person.name);
  const handleAdd = async (values: PersonEditorValues) => {
    await addPerson(values.name, values.icon);
    setMode(null);
  };
  const handleEdit = (id: string) => async (values: PersonEditorValues) => {
    if (id === localUser?.id) await setLocalUser(values.name, values.icon);
    else await updatePerson(id, values);
    setMode(null);
  };
  const handleDelete = async (id: string) => {
    setError(null);
    if (!window.confirm("Remove this contact from your device? This cannot be undone.")) return;
    try {
      await removePerson(id);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not delete this person");
    }
  };
  const visible = people
    .filter(
      (person) =>
        person.id !== localUser?.id &&
        person.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return (
    <div className="page page-narrow flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="soft-caption">Everyone you split with — one person, every group</p>
        </div>
        {mode?.type !== "add" && (
          <button
            className="btn btn-primary max-sm:hidden"
            type="button"
            onClick={() => {
              setError(null);
              setMode({ type: "add" });
            }}
          >
            ＋ New contact
          </button>
        )}
      </header>
      <label className="max-w-sm">
        <span className="sr-only">Search contacts</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="⌕  Search contacts…"
          className="form-input"
        />
      </label>
      {error && (
        <p role="alert" className="note money-negative">
          {error}
        </p>
      )}
      {mode?.type === "add" && (
        <PersonEditor
          existingNames={namesExcept()}
          onSave={handleAdd}
          onCancel={() => setMode(null)}
          submitLabel="Add contact"
        />
      )}
      {visible.length ? (
        <Surface className="px-5">
          <ul>
            {visible.map((person) => {
              const linked = members.filter((member) => member.personId === person.id);
              const groupIds = new Set(linked.map((member) => member.groupId));
              const count = expenses.filter((expense) =>
                linked.some(
                  (member) =>
                    expense.groupId === member.groupId &&
                    (expense.createdBy === member.id ||
                      expense.transactions.paid.some((row) => row.memberId === member.id) ||
                      expense.transactions.owes.some((row) => row.memberId === member.id)),
                ),
              ).length;
              const balances = linked.map((member) => ({
                group: groups.find((group) => group.id === member.groupId),
                net: calculateMemberNet(
                  expenses.filter((expense) => expense.groupId === member.groupId),
                  member.id,
                ),
              }));
              return (
                <li key={person.id}>
                  {mode?.type === "edit" && mode.id === person.id ? (
                    <PersonEditor
                      existingNames={namesExcept(person.id)}
                      initial={{ name: person.name, icon: person.icon }}
                      onSave={handleEdit(person.id)}
                      onCancel={() => setMode(null)}
                    />
                  ) : (
                    <div className="ui-row">
                      <Avatar icon={person.icon} name={person.name} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{person.name}</p>
                        <p className="soft-caption">
                          {groupIds.size
                            ? `${groupIds.size} ${groupIds.size === 1 ? "group" : "groups"} · ${count} expenses`
                            : "not in any group yet"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 max-sm:hidden">
                        {balances.slice(0, 3).map(
                          ({ group }) =>
                            group && (
                              <span key={group.id} className="group relative inline-flex">
                                <Link
                                  aria-label={`Open ${group.name}`}
                                  to={`/groups/${group.id}/members`}
                                  className="chip !px-2"
                                >
                                  {group.icon}
                                </Link>
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none invisible absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-xs font-semibold text-[var(--surface)] opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                                >
                                  {group.name}
                                </span>
                              </span>
                            ),
                        )}
                      </div>
                      <div className="ml-auto flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary !px-3"
                          onClick={() => setMode({ type: "edit", id: person.id })}
                          aria-label={`Edit ${person.name}`}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger !px-3"
                          onClick={() => void handleDelete(person.id)}
                          aria-label={`Delete ${person.name}`}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Surface>
      ) : (
        <EmptyState
          icon="🦋"
          title={query ? "No matching contacts" : "No contacts yet"}
          description={
            query
              ? "Try another name."
              : "Add someone to split with, then invite them into a group."
          }
        />
      )}
      <p className="note">
        🔒 A contact is one person across the whole app. Edits apply everywhere; removal requires
        that person to leave their groups first.
      </p>
      {mode?.type !== "add" && (
        <button type="button" className="mobile-cta" onClick={() => setMode({ type: "add" })}>
          ＋ New contact
        </button>
      )}
    </div>
  );
};

export default PeopleList;
