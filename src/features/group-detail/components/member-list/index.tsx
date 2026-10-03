import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import PersonEditor from "@/features/people/components/person-editor";

import { useStore } from "@/shared/configs/store";
import { useViewport } from "@/shared/hooks/use-viewport";
import type { PersonEditorValues } from "@/features/people/helpers/schema";

import type {
  GroupDetailContext,
  GroupMemberWithPerson,
} from "@/features/group-detail/types/group-detail.types";
import type { Person } from "@/shared/types/domain.types";

import Avatar from "@/shared/ui/avatar";
import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";

type MemberMode = { type: "add" } | { type: "edit"; memberId: string } | null;

const MemberList = () => {
  const { isMobile } = useViewport();
  const { group, groupMembers, groupExpenses } = useOutletContext<GroupDetailContext>();
  const { localUser, people, addMember, addPerson, updatePerson, removeMember, setLocalUser } =
    useStore();
  const [mode, setMode] = useState<MemberMode>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [blockedMemberId, setBlockedMemberId] = useState<string | null>(null);
  const [confirmMemberId, setConfirmMemberId] = useState<string | null>(null);
  const addingMember = useRef(false);
  const blockedDialogRef = useRef<HTMLDialogElement>(null);

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
  };

  const handleOpenAdd = () => {
    setMemberError(null);
    setMode({ type: "add" });
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

  const memberExpenseCount = (memberId: string) =>
    groupExpenses.filter(
      (expense) =>
        expense.createdBy === memberId ||
        expense.transactions.paid.some((transaction) => transaction.memberId === memberId) ||
        expense.transactions.owes.some((transaction) => transaction.memberId === memberId),
    ).length;
  const blockedMember = groupMembers.find((member) => member.id === blockedMemberId);
  const confirmMember = groupMembers.find((member) => member.id === confirmMemberId);

  const handleDeleteMember = (member: GroupMemberWithPerson) => {
    setMemberError(null);
    if (memberExpenseCount(member.id)) {
      setBlockedMemberId(member.id);
      blockedDialogRef.current?.showModal();
      return;
    }
    setConfirmMemberId(member.id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmMemberId) return;
    await removeMember(confirmMemberId);
    if (mode?.type === "edit" && mode.memberId === confirmMemberId) closeEditor();
    setConfirmMemberId(null);
  };

  return (
    <section className="member-list flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Members</h2>
          <p className="soft-caption">{groupMembers.length} in this group</p>
        </div>
        {mode?.type !== "add" && (
          <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
            <Icon icon={Plus} size={18} /> Add member
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
          className="member-editor flex min-w-0 flex-col gap-3 disabled:opacity-60"
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
                    <EmojiImage icon={person.icon} kind="profile" />
                    <span>{person.name}</span>
                    <Icon icon={Plus} size={16} className="text-[var(--brand-ink)]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <PersonEditor
            existingNames={existingNames()}
            onSave={handleCreatePerson}
            onCancel={closeEditor}
            submitLabel="Add"
          />
        </fieldset>
      )}

      {editingMember?.person && (
        <div className="member-editor py-2">
          <PersonEditor
            existingNames={existingNames(editingMember.personId)}
            initial={{ name: editingMember.person.name, icon: editingMember.person.icon }}
            onSave={handleEditMember(editingMember)}
            onCancel={closeEditor}
          />
        </div>
      )}

      <ul className="member-list-scroll surface px-5">
        {sortedMembers.map((member) => (
          <li key={member.id} className="ui-row member-entry">
            <span className="member-entry-identity flex min-w-0 flex-1 items-center gap-3">
              <Avatar icon={member.person?.icon} name={member.person?.name} />
              {isMobile ? (
                <button
                  type="button"
                  className="member-entry-tooltip"
                  data-tooltip={member.person?.name ?? "Unknown person"}
                  aria-label={`Show full name: ${member.person?.name ?? "Unknown person"}`}
                >
                  <span className="block truncate text-sm font-medium text-gray-900">
                    {member.person?.name ?? "Unknown person"}
                    {member.personId === localUser?.id && (
                      <span className="ml-2 text-xs text-gray-400">You</span>
                    )}
                  </span>
                </button>
              ) : (
                <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                  {member.person?.name ?? "Unknown person"}
                  {member.personId === localUser?.id && (
                    <span className="ml-2 text-xs text-gray-400">You</span>
                  )}
                </span>
              )}
            </span>
            <span className="member-entry-actions ml-auto flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenEdit(member.id)}
                disabled={isAddingMember || !member.person}
                className="btn btn-secondary"
              >
                <Icon icon={Pencil} size={17} /> Edit
              </button>
              {member.personId !== localUser?.id && (
                <>
                  {memberExpenseCount(member.id) > 0 && (
                    <span id={`blocked-member-${member.id}`} className="sr-only">
                      Cannot remove while this member is in an expense. Select to learn why.
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member)}
                    disabled={isAddingMember}
                    aria-describedby={
                      memberExpenseCount(member.id) ? `blocked-member-${member.id}` : undefined
                    }
                    aria-label={`Delete ${member.person?.name ?? "member"}`}
                    className={`btn ${memberExpenseCount(member.id) ? "btn-blocked" : "btn-danger"}`}
                  >
                    <Icon icon={Trash2} size={17} /> Delete
                  </button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
      <dialog
        ref={blockedDialogRef}
        aria-labelledby="blocked-member-title"
        aria-describedby="blocked-member-description"
        onClose={() => setBlockedMemberId(null)}
        className="m-auto w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      >
        <h2 id="blocked-member-title" className="section-title">
          Cannot remove {blockedMember?.person?.name ?? "this member"}
        </h2>
        <p id="blocked-member-description" className="mt-3 text-sm leading-relaxed">
          {blockedMember?.person?.name ?? "This member"} is referenced by{" "}
          {blockedMember ? memberExpenseCount(blockedMember.id) : 0} group{" "}
          {blockedMember && memberExpenseCount(blockedMember.id) === 1 ? "expense" : "expenses"} as
          a creator, payer, or split participant. Edit those references or delete the expenses
          before removing this member. An expense they created must be deleted, since its creator
          cannot be reassigned.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => blockedDialogRef.current?.close()}
            className="btn btn-secondary"
          >
            Close
          </button>
          {blockedMember && (
            <Link
              to={`/groups/${group.id}/expenses?${new URLSearchParams({ memberIds: blockedMember.id })}`}
              className="btn btn-primary"
            >
              View {blockedMember.person?.name ?? "member"}'s expenses
            </Link>
          )}
        </div>
      </dialog>
      <ConfirmationDialog
        open={Boolean(confirmMember)}
        title={`Remove ${confirmMember?.person?.name ?? "member"}?`}
        description={`They will be removed from “${group.name}” but remain in your contacts.`}
        confirmLabel="Remove member"
        pendingLabel="Removing…"
        onCancel={() => setConfirmMemberId(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
};

export default MemberList;
