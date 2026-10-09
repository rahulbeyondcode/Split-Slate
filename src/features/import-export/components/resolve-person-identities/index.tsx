import { zodResolver } from "@hookform/resolvers/zod";
import type { SyntheticEvent } from "react";
import { useEffect, useRef } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import Input from "@/shared/components/form-elements/input";

import type { PersonConflict } from "@/features/import-export/utils/person-conflicts";

import type {
  ExistingPersonRename,
  PersonResolution,
} from "@/features/import-export/types/import-export.types";

import DialogLayout from "@/shared/ui/dialog-layout";
import EmojiImage from "@/shared/ui/emoji-image";
import StatusBanner from "@/shared/ui/status-banner";

interface PropsType {
  conflicts: PersonConflict[];
  sourceGroupName: string;
  existingGroups: Record<string, string[]>;
  pending: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (resolutions: PersonResolution[], renames: ExistingPersonRename[]) => void;
}

const schema = z.object({
  decisions: z.array(
    z.object({
      type: z.enum(["reuse", "separate"]),
      destinationPersonId: z.string(),
      name: z.string(),
    }),
  ),
  existingNames: z.array(z.string()),
});
type Values = z.infer<typeof schema>;

const ResolvePersonIdentities = ({
  conflicts,
  sourceGroupName,
  existingGroups,
  pending,
  error,
  onCancel,
  onConfirm,
}: PropsType) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  const existing = [
    ...new Map(
      conflicts.flatMap((item) => item.existing.map((person) => [person.id, person] as const)),
    ).values(),
  ];
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      decisions: conflicts.map((item) => ({
        type: "separate" as const,
        destinationPersonId: item.existing[0]?.id ?? "",
        name: item.incoming.name,
      })),
      existingNames: existing.map((person) => person.name),
    },
  });
  const decisions = useWatch({ control: methods.control, name: "decisions" });
  const handleSubmit = methods.handleSubmit((values) => {
    const resolutions: PersonResolution[] = conflicts.map(({ incoming }, index) => {
      const choice = values.decisions[index];
      return choice.type === "reuse"
        ? {
            sourcePersonId: incoming.id,
            type: "reuse",
            destinationPersonId: choice.destinationPersonId,
          }
        : { sourcePersonId: incoming.id, type: "separate", name: choice.name };
    });
    const renames: ExistingPersonRename[] = existing.flatMap((person, index) => {
      const name = values.existingNames[index]?.trim();
      return name && name !== person.name ? [{ personId: person.id, name }] : [];
    });
    onConfirm(resolutions, renames);
  });
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (pending) event.preventDefault();
    else onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="resolve-people-title"
      className="app-dialog max-w-xl rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
      onCancel={handleCancel}
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit} className="dialog-form">
          <DialogLayout
            title="Resolve matching names"
            titleId="resolve-people-title"
            onClose={onCancel}
            closeDisabled={pending}
            bodyClassName="flex flex-col gap-5"
            footer={
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={pending}
                  onClick={onCancel}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? "Importing…" : "Confirm and import"}
                </button>
              </>
            }
          >
            <p className="soft-caption">
              A name alone does not tell us whether two contacts are the same person. Decide for
              each match before the new group is imported.
            </p>
            {conflicts.map(({ incoming, existing: candidates, arriving }, index) => (
              <fieldset key={incoming.id} className="rounded-2xl border border-[var(--line)] p-4">
                <legend className="px-1 font-semibold">
                  <EmojiImage icon={incoming.icon} kind="profile" /> {incoming.name} ·{" "}
                  {sourceGroupName}
                </legend>
                {candidates.map((person) => (
                  <p key={person.id} className="soft-caption mt-1">
                    Already here: <EmojiImage icon={person.icon} kind="profile" /> {person.name} ·{" "}
                    {existingGroups[person.id]?.join(", ") || "Contacts only"}
                  </p>
                ))}
                {arriving.map((person) => (
                  <p key={person.id} className="soft-caption mt-1">
                    Also arriving: <EmojiImage icon={person.icon} kind="profile" /> {person.name} ·{" "}
                    {sourceGroupName}
                  </p>
                ))}
                {candidates.length > 0 && (
                  <label className="choice-option mt-3">
                    <input
                      type="radio"
                      value="reuse"
                      className="choice-control"
                      {...methods.register(`decisions.${index}.type`)}
                    />
                    Same person — reuse an existing contact
                  </label>
                )}
                <label className="choice-option mt-2">
                  <input
                    type="radio"
                    value="separate"
                    className="choice-control"
                    {...methods.register(`decisions.${index}.type`)}
                  />
                  Different people — keep separate contacts
                </label>
                {decisions?.[index]?.type === "reuse" && (
                  <label className="mt-3 block text-sm">
                    <span className="field-label">Reuse contact</span>
                    <select
                      {...methods.register(`decisions.${index}.destinationPersonId`)}
                      className="form-input"
                    >
                      {candidates.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name} · {existingGroups[person.id]?.join(", ") || "Contacts only"}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {decisions?.[index]?.type !== "reuse" && (
                  <div className="mt-3">
                    <label className="field-label" htmlFor={`incoming-${index}`}>
                      Name for the incoming contact
                    </label>
                    <Input id={`incoming-${index}`} name={`decisions.${index}.name`} />
                  </div>
                )}
              </fieldset>
            ))}
            {existing.length > 0 && (
              <section className="rounded-2xl border border-[var(--line)] p-4">
                <h3 className="font-semibold">Optional: rename existing contacts instead</h3>
                <p className="soft-caption mt-1">
                  Changing an existing contact’s name changes it in every group they belong to.
                </p>
                {existing.map((person, index) => (
                  <div key={person.id} className="mt-3">
                    <label className="field-label" htmlFor={`existing-${index}`}>
                      <EmojiImage icon={person.icon} kind="profile" /> {person.name} ·{" "}
                      {existingGroups[person.id]?.join(", ") || "Contacts only"}
                    </label>
                    <Input id={`existing-${index}`} name={`existingNames.${index}`} />
                  </div>
                ))}
              </section>
            )}
            {error && <StatusBanner variant="error">{error}</StatusBanner>}
          </DialogLayout>
        </form>
      </FormProvider>
    </dialog>
  );
};

export default ResolvePersonIdentities;
