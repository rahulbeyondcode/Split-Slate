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
import DialogLayout from "@/shared/ui/dialog-layout";
import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";
import MobileEditorDialog from "@/shared/ui/mobile-editor-dialog";

type MemberMode = { type: "add" } | { type: "edit"; memberId: string } | null;

const MemberList = () => {
  const { isMobile } = useViewport();
  const { group, groupMembers, groupExpenses, groupSettlements } =
    useOutletContext<GroupDetailContext>();
  const { localUser, people, addMember, addPerson, updatePerson, removeMember, setLocalUser } =
    useStore();
  const [mode, setMode] = useState<MemberMode>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
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
      setIsEditingMember(true);
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
      } finally {
        setIsEditingMember(false);
      }
    };

  const memberExpenseCount = (memberId: string) =>
    groupExpenses.filter(
      (expense) =>
        expense.createdBy === memberId ||
        expense.transactions.paid.some((transaction) => transaction.memberId === memberId) ||
        expense.transactions.owes.some((transaction) => transaction.memberId === memberId),
    ).length;
  const memberPaymentCount = (memberId: string) =>
    groupSettlements.filter(
      (payment) =>
        payment.fromMemberId === memberId ||
        payment.toMemberId === memberId ||
        payment.recordedBy === memberId,
    ).length;
  const memberRecordCount = (memberId: string) =>
    memberExpenseCount(memberId) + memberPaymentCount(memberId);
  const blockedMember = groupMembers.find((member) => member.id === blockedMemberId);
  const confirmMember = groupMembers.find((member) => member.id === confirmMemberId);

  const handleDeleteMember = (member: GroupMemberWithPerson) => {
    setMemberError(null);
    if (memberRecordCount(member.id)) {
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
  const friendPicker = availablePeople.length > 0 && (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Add from friends</p>
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
  );
  const addEditor = mode?.type === "add" && (
    <PersonEditor
      existingNames={existingNames()}
      onSave={handleCreatePerson}
      onCancel={closeEditor}
      submitLabel="Add"
      inDialog
      beforeFields={friendPicker}
      error={memberError}
      busy={isAddingMember}
    />
  );
  const editEditor = editingMember?.person && (
    <PersonEditor
      existingNames={existingNames(editingMember.personId)}
      initial={{ name: editingMember.person.name, icon: editingMember.person.icon }}
      onSave={handleEditMember(editingMember)}
      onCancel={closeEditor}
      inDialog
      error={memberError}
      busy={isEditingMember}
    />
  );

  return (
    <section className="member-list flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Members</h2>
          <p className="soft-caption">{groupMembers.length} in this group</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          disabled={isAddingMember}
          className="btn btn-primary"
        >
          <Icon icon={Plus} size={18} /> Add member
        </button>
      </div>

      {memberError && !mode && (
        <p role="alert" className="note money-negative">
          {memberError}
        </p>
      )}

      {mode?.type === "add" && (
        <MobileEditorDialog title="Add a person" onCancel={closeEditor} busy={isAddingMember}>
          {addEditor}
        </MobileEditorDialog>
      )}

      {editingMember?.person && (
        <MobileEditorDialog title="Edit person" onCancel={closeEditor} busy={isEditingMember}>
          {editEditor}
        </MobileEditorDialog>
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
                  {memberRecordCount(member.id) > 0 && (
                    <span id={`blocked-member-${member.id}`} className="sr-only">
                      Cannot remove while this member is in an expense or payment. Select to learn
                      why.
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(member)}
                    disabled={isAddingMember}
                    aria-describedby={
                      memberRecordCount(member.id) ? `blocked-member-${member.id}` : undefined
                    }
                    aria-label={`Delete ${member.person?.name ?? "member"}`}
                    className={`btn ${memberRecordCount(member.id) ? "btn-blocked" : "btn-danger"}`}
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
        className="app-dialog max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      >
        <DialogLayout
          title={`Cannot remove ${blockedMember?.person?.name ?? "this member"}`}
          titleId="blocked-member-title"
          onClose={() => blockedDialogRef.current?.close()}
          closeLabel="Dismiss message"
          footer={
            <>
              <button
                type="button"
                autoFocus
                onClick={() => blockedDialogRef.current?.close()}
                className="btn btn-secondary"
              >
                Close
              </button>
              {blockedMember && memberExpenseCount(blockedMember.id) > 0 && (
                <Link
                  to={`/groups/${group.id}/expenses?${new URLSearchParams({ memberIds: blockedMember.id })}`}
                  className="btn btn-primary"
                >
                  View {blockedMember.person?.name ?? "member"}'s expenses
                </Link>
              )}
              {blockedMember && memberPaymentCount(blockedMember.id) > 0 && (
                <Link to={`/groups/${group.id}/balances`} className="btn btn-primary">
                  View recorded payments
                </Link>
              )}
            </>
          }
        >
          <p id="blocked-member-description" className="text-sm leading-relaxed">
            {blockedMember?.person?.name ?? "This member"} is referenced by{" "}
            {blockedMember ? memberExpenseCount(blockedMember.id) : 0}{" "}
            {blockedMember && memberExpenseCount(blockedMember.id) === 1 ? "expense" : "expenses"}{" "}
            and {blockedMember ? memberPaymentCount(blockedMember.id) : 0}{" "}
            {blockedMember && memberPaymentCount(blockedMember.id) === 1 ? "payment" : "payments"}.
            Edit or delete those records before removing this member. An expense they created must
            be deleted, since its creator cannot be reassigned.
          </p>
        </DialogLayout>
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
