import { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";

import PersonEditor from "@/features/people/components/person-editor";

import { useStore } from "@/shared/configs/store";
import type { PersonEditorValues } from "@/features/people/helpers/schema";

import type {
  GroupDetailContext,
  GroupMemberWithPerson,
} from "@/features/group-detail/types/group-detail.types";
import type { Person } from "@/shared/types/domain.types";

type MemberMode = { type: "add" } | { type: "edit"; memberId: string } | null;

const MemberList = () => {
  const { group, groupMembers, groupExpenses } = useOutletContext<GroupDetailContext>();
  const { localUser, people, addMember, addPerson, updatePerson, removeMember, setLocalUser } =
    useStore();
  const [mode, setMode] = useState<MemberMode>(null);
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const addingMember = useRef(false);

  const groupPersonIds = new Set(groupMembers.map((member) => member.personId));
  const availablePeople = people
    .filter((person) => !groupPersonIds.has(person.id))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const sortedMembers = [...groupMembers].sort((a, b) => {
    if (a.personId === localUser?.id) return -1;
    if (b.personId === localUser?.id) return 1;
    return (a.person?.name ?? "Unknown person").localeCompare(
      b.person?.name ?? "Unknown person",
      undefined,
      { sensitivity: "base" },
    );
  });
  const editingMember =
    mode?.type === "edit" ? groupMembers.find((member) => member.id === mode.memberId) : undefined;
  const existingNames = (personId?: string) =>
    people.filter((person) => person.id !== personId).map((person) => person.name);

  const closeEditor = () => {
    setMode(null);
    setIsCreatingPerson(false);
  };

  const handleOpenAdd = () => {
    setMemberError(null);
    setMode({ type: "add" });
    setIsCreatingPerson(false);
  };

  const handleOpenEdit = (memberId: string) => {
    setMemberError(null);
    setMode({ type: "edit", memberId });
  };

  const handleAddExistingPerson = async (person: Person) => {
    if (addingMember.current) return;
    addingMember.current = true;
    setIsAddingMember(true);
    setMemberError(null);
    try {
      await addMember(group.id, person.id);
      closeEditor();
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : "Could not add this member");
    } finally {
      addingMember.current = false;
      setIsAddingMember(false);
    }
  };

  const handleCreatePerson = async (values: PersonEditorValues) => {
    if (addingMember.current) return;
    addingMember.current = true;
    setIsAddingMember(true);
    setMemberError(null);
    try {
      const person = await addPerson(values.name, values.icon);
      await addMember(group.id, person.id);
      closeEditor();
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : "Could not add this member");
    } finally {
      addingMember.current = false;
      setIsAddingMember(false);
    }
  };

  const handleEditMember =
    (member: GroupMemberWithPerson) => async (values: PersonEditorValues) => {
      setMemberError(null);
      try {
        if (member.personId === localUser?.id) {
          await setLocalUser(values.name, values.icon);
        } else {
          await updatePerson(member.personId, values);
        }
        closeEditor();
      } catch (error) {
        setMemberError(error instanceof Error ? error.message : "Could not update this member");
      }
    };

  const isMemberInUse = (memberId: string) =>
    groupExpenses.some(
      (expense) =>
        expense.createdBy === memberId ||
        expense.transactions.paid.some((transaction) => transaction.memberId === memberId) ||
        expense.transactions.owes.some((transaction) => transaction.memberId === memberId),
    );

  const handleDeleteMember = async (member: GroupMemberWithPerson) => {
    setMemberError(null);
    const memberName = member.person?.name ?? "this member";
    if (isMemberInUse(member.id)) {
      setMemberError(
        `“${memberName}” is involved in an expense. Reassign those expenses before removing them.`,
      );
      return;
    }

    const confirmed = window.confirm(
      `Remove “${memberName}” from “${group.name}”? They will remain in your friends list.`,
    );
    if (!confirmed) return;

    try {
      await removeMember(member.id);
      if (mode?.type === "edit" && mode.memberId === member.id) closeEditor();
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : "Could not remove this member");
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="soft-caption">{groupMembers.length} in this group</p>
        </div>
        {mode?.type !== "add" && (
          <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
            Add member
          </button>
        )}
      </div>

      {memberError && (
        <p role="alert" className="note money-negative">
          {memberError}
        </p>
      )}

      {mode?.type === "add" && (
        <fieldset
          disabled={isAddingMember}
          aria-busy={isAddingMember}
          className="surface surface-pad flex min-w-0 flex-col gap-3 disabled:opacity-60"
        >
          {availablePeople.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Add from friends
              </p>
              <div className="flex flex-wrap gap-2">
                {availablePeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleAddExistingPerson(person)}
                    className="chip"
                  >
                    <span>{person.icon}</span>
                    <span>{person.name}</span>
                    <span className="text-gray-400">+</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isCreatingPerson ? (
            <PersonEditor
              existingNames={existingNames()}
              onSave={handleCreatePerson}
              onCancel={() => setIsCreatingPerson(false)}
              submitLabel="Add"
            />
          ) : (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 text-sm text-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingPerson(true)}
                className="rounded border border-dashed border-gray-400 px-4 py-2 text-sm text-gray-600"
              >
                + Add new person
              </button>
            </div>
          )}
        </fieldset>
      )}

      {editingMember?.person && (
        <div className="py-2">
          <PersonEditor
            existingNames={existingNames(editingMember.personId)}
            initial={{ name: editingMember.person.name, icon: editingMember.person.icon }}
            onSave={handleEditMember(editingMember)}
            onCancel={closeEditor}
          />
        </div>
      )}

      <ul className="surface px-5">
        {sortedMembers.map((member) => (
          <li key={member.id} className="ui-row">
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span className="avatar">{member.person?.icon}</span>
              <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                {member.person?.name ?? "Unknown person"}
                {member.personId === localUser?.id && (
                  <span className="ml-2 text-xs text-gray-400">You</span>
                )}
              </span>
            </span>
            <span className="ml-auto flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenEdit(member.id)}
                disabled={isAddingMember || !member.person}
                className="btn btn-secondary"
              >
                Edit
              </button>
              {member.personId !== localUser?.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteMember(member)}
                  disabled={isAddingMember}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default MemberList;
