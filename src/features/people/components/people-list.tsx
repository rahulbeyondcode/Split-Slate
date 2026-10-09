import { ArrowRight, LockKeyhole, Pencil, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import PersonEditor from "@/features/people/components/person-editor";

import { useStore } from "@/shared/configs/store";
import { calculateMemberNet } from "@/shared/utils/balances";
import type { PersonEditorValues } from "@/features/people/helpers/schema";

import Avatar from "@/shared/ui/avatar";
import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import DialogLayout from "@/shared/ui/dialog-layout";
import EmojiImage from "@/shared/ui/emoji-image";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

type EditorMode = { type: "add" } | { type: "edit"; id: string } | null;

const PeopleList = () => {
  const {
    localUser,
    people,
    groups,
    members,
    expenses,
    settlements,
    addPerson,
    updatePerson,
    removePerson,
    setLocalUser,
  } = useStore();
  const [mode, setMode] = useState<EditorMode>(null);
  const [query, setQuery] = useState("");
  const [blockedPersonId, setBlockedPersonId] = useState<string | null>(null);
  const [confirmPersonId, setConfirmPersonId] = useState<string | null>(null);
  const blockedDialogRef = useRef<HTMLDialogElement>(null);
  const namesExcept = (id?: string) =>
    people.filter((person) => person.id !== id).map((person) => person.name);
  const blockingGroupsFor = (personId: string) =>
    members
      .filter((member) => member.personId === personId)
      .flatMap((member) => {
        const group = groups.find((item) => item.id === member.groupId);
        const count = expenses.filter(
          (expense) =>
            expense.groupId === member.groupId &&
            (expense.createdBy === member.id ||
              expense.transactions.paid.some((row) => row.memberId === member.id) ||
              expense.transactions.owes.some((row) => row.memberId === member.id)),
        ).length;
        const paymentCount = settlements.filter(
          (settlement) =>
            settlement.groupId === member.groupId &&
            [settlement.fromMemberId, settlement.toMemberId, settlement.recordedBy].includes(
              member.id,
            ),
        ).length;
        return group && (count || paymentCount)
          ? [{ group, memberId: member.id, count, paymentCount }]
          : [];
      })
      .sort((a, b) => a.group.name.localeCompare(b.group.name));
  const handleAdd = async (values: PersonEditorValues) => {
    await addPerson(values.name, values.icon);
    setMode(null);
  };
  const handleEdit = (id: string) => async (values: PersonEditorValues) => {
    if (id === localUser?.id) await setLocalUser(values.name, values.icon);
    else await updatePerson(id, values);
    setMode(null);
  };
  const handleDelete = (id: string) => {
    if (blockingGroupsFor(id).length) {
      setBlockedPersonId(id);
      blockedDialogRef.current?.showModal();
      return;
    }
    setConfirmPersonId(id);
  };
  const handleConfirmDelete = async () => {
    if (!confirmPersonId) return;
    await removePerson(confirmPersonId);
    setConfirmPersonId(null);
  };
  const visible = people
    .filter(
      (person) =>
        person.id !== localUser?.id &&
        person.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const blockedPerson = people.find((person) => person.id === blockedPersonId);
  const confirmPerson = people.find((person) => person.id === confirmPersonId);
  const blockedGroups = blockedPerson ? blockingGroupsFor(blockedPerson.id) : [];

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
              setMode({ type: "add" });
            }}
          >
            <Icon icon={Plus} size={18} /> New contact
          </button>
        )}
      </header>
      <label className="relative block max-w-sm">
        <span className="sr-only">Search contacts</span>
        <Icon
          icon={Search}
          size={19}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Search contacts…"
          className="form-input !pl-10"
        />
      </label>
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
              const blockingGroups = blockingGroupsFor(person.id);
              const count = blockingGroups.reduce(
                (total, item) => total + item.count + item.paymentCount,
                0,
              );
              const balances = linked.map((member) => ({
                group: groups.find((group) => group.id === member.groupId),
                net: calculateMemberNet(
                  expenses.filter((expense) => expense.groupId === member.groupId),
                  member.id,
                  settlements.filter((settlement) => settlement.groupId === member.groupId),
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
                            ? `${groupIds.size} ${groupIds.size === 1 ? "group" : "groups"} · ${count} records`
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
                                  <EmojiImage icon={group.icon} />
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
                          <Icon icon={Pencil} size={18} />
                        </button>
                        <button
                          type="button"
                          className={`btn !px-3 ${count ? "btn-blocked" : "btn-danger"}`}
                          onClick={() => handleDelete(person.id)}
                          aria-label={`Delete ${person.name}`}
                          aria-describedby={count ? `blocked-contact-${person.id}` : undefined}
                        >
                          <Icon icon={Trash2} size={18} />
                        </button>
                        {count > 0 && (
                          <span id={`blocked-contact-${person.id}`} className="sr-only">
                            Cannot delete while this contact is in an expense or payment. Select to
                            learn why.
                          </span>
                        )}
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
          icon={UsersRound}
          title={query ? "No matching contacts" : "No contacts yet"}
          description={
            query
              ? "Try another name."
              : "Add someone to split with, then invite them into a group."
          }
        />
      )}
      <p className="note flex items-start gap-2">
        <Icon icon={LockKeyhole} size={18} />
        <span>
          A contact is one person across the whole app. Edits apply everywhere; removal requires
          that person to leave their groups first.
        </span>
      </p>
      <dialog
        ref={blockedDialogRef}
        aria-labelledby="blocked-contact-title"
        aria-describedby="blocked-contact-description"
        onClose={() => setBlockedPersonId(null)}
        className="app-dialog max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      >
        <DialogLayout
          title={`Cannot delete ${blockedPerson?.name ?? "this contact"}`}
          titleId="blocked-contact-title"
          onClose={() => blockedDialogRef.current?.close()}
          closeLabel="Dismiss message"
          footer={
            <button
              type="button"
              autoFocus
              onClick={() => blockedDialogRef.current?.close()}
              className="btn btn-secondary"
            >
              Close
            </button>
          }
        >
          <p id="blocked-contact-description" className="text-sm leading-relaxed">
            {blockedPerson?.name ?? "This contact"} is referenced in expenses or recorded payments
            across the groups below. Edit those references or delete the records before removing this
            contact. An expense they created must be deleted, since its creator cannot be reassigned.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {blockedGroups.map(({ group, memberId, count, paymentCount }) => (
              <div key={memberId} className="flex flex-col gap-2">
                {count > 0 && (
                  <Link
                    to={`/groups/${group.id}/expenses?${new URLSearchParams({ memberIds: memberId })}`}
                    className="btn btn-secondary justify-between !rounded-xl"
                  >
                    <span className="min-w-0 truncate">
                      <EmojiImage icon={group.icon} /> {group.name}
                    </span>
                    <span className="shrink-0">
                      {count} {count === 1 ? "expense" : "expenses"}{" "}
                      <Icon icon={ArrowRight} size={16} />
                    </span>
                  </Link>
                )}
                {paymentCount > 0 && (
                  <Link
                    to={`/groups/${group.id}/balances`}
                    className="btn btn-secondary justify-between !rounded-xl"
                  >
                    <span className="min-w-0 truncate">
                      <EmojiImage icon={group.icon} /> {group.name}
                    </span>
                    <span className="shrink-0">
                      {paymentCount} {paymentCount === 1 ? "payment" : "payments"}{" "}
                      <Icon icon={ArrowRight} size={16} />
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </DialogLayout>
      </dialog>
      <ConfirmationDialog
        open={Boolean(confirmPerson)}
        title={`Delete ${confirmPerson?.name ?? "contact"}?`}
        description="This removes the contact from your device and any groups they belong to. This cannot be undone."
        confirmLabel="Delete contact"
        onCancel={() => setConfirmPersonId(null)}
        onConfirm={handleConfirmDelete}
      />
      {mode?.type !== "add" && (
        <button type="button" className="mobile-cta" onClick={() => setMode({ type: "add" })}>
          <Icon icon={Plus} size={20} /> New contact
        </button>
      )}
    </div>
  );
};

export default PeopleList;
