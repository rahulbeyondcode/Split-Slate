import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import ResolvePersonIdentities from "@/features/import-export/components/resolve-person-identities";
import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { importGroupTransfer } from "@/features/import-export/store";
import {
  type ImportIdentityFormValues,
  importIdentitySchema,
} from "@/features/import-export/utils/import-identity-schema";
import type { PersonConflict } from "@/features/import-export/utils/person-conflicts";
import { PersonConflictsError } from "@/features/import-export/utils/person-conflicts";
import { useStore } from "@/shared/configs/store";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";
import type {
  ExistingPersonRename,
  GroupTransferSource,
  ImportIdentity,
  PersonResolution,
} from "@/features/import-export/types/import-export.types";
import type { Group } from "@/shared/types/domain.types";

import EmojiImage from "@/shared/ui/emoji-image";
import StatusBanner from "@/shared/ui/status-banner";

interface PropsType {
  source: GroupTransferSource;
  onImported: (group: Group) => void;
}

const ImportReview = ({ source, onImported }: PropsType) => {
  const { bundle } = source;
  const { localUser, groups, members, people, init } = useStore();
  const methods = useForm<ImportIdentityFormValues>({
    resolver: zodResolver(importIdentitySchema),
    defaultValues: {
      memberId: bundle.members.length ? "" : "new",
      name: localUser?.name ?? "",
      icon: localUser?.icon ?? PERSON_EMOJIS[0],
    },
  });
  const memberId = useWatch({ control: methods.control, name: "memberId" });
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<PersonConflict[] | null>(null);
  const [chosenIdentity, setChosenIdentity] = useState<ImportIdentity | null>(null);

  const existingNames = new Set(groups.map((group) => group.name));
  let destinationName = bundle.group.name;
  let suffix = 2;
  while (existingNames.has(destinationName)) {
    destinationName = `${bundle.group.name} (${suffix})`;
    suffix += 1;
  }

  const memberName = (sourceMemberId: string) => {
    const member = bundle.members.find((item) => item.id === sourceMemberId);
    return bundle.people.find((person) => person.id === member?.personId)?.name ?? "Unknown member";
  };

  const performImport = async (
    identity: ImportIdentity,
    personResolutions?: PersonResolution[],
    existingPersonRenames?: ExistingPersonRename[],
  ) => {
    setImporting(true);
    setError("");
    try {
      const result = await importGroupTransfer({
        source,
        identity,
        personResolutions,
        existingPersonRenames,
      });
      await init();
      onImported(result.group);
    } catch (failure) {
      if (failure instanceof PersonConflictsError) {
        setConflicts(failure.conflicts);
      } else {
        setError(failure instanceof Error ? failure.message : "Could not import this group");
      }
      setImporting(false);
    }
  };
  const handleImport = (values: ImportIdentityFormValues) => {
    const identity: ImportIdentity =
      values.memberId === "new"
        ? { type: "new", name: values.name, icon: values.icon }
        : { type: "member", memberId: values.memberId };
    setChosenIdentity(identity);
    void performImport(identity);
  };
  const handleConfirmPeople = (
    personResolutions: PersonResolution[],
    existingPersonRenames: ExistingPersonRename[],
  ) => {
    if (chosenIdentity)
      void performImport(chosenIdentity, personResolutions, existingPersonRenames);
  };
  const handleCancelPeople = () => {
    setConflicts(null);
    setChosenIdentity(null);
    setError("");
  };
  const existingGroups = Object.fromEntries(
    people.map((person) => [
      person.id,
      [
        ...new Set(
          members
            .filter((member) => member.personId === person.id)
            .map((member) => groups.find((group) => group.id === member.groupId)?.name)
            .filter((name): name is string => Boolean(name)),
        ),
      ],
    ]),
  );

  const counts = bundle.manifest.includedCounts;
  const omittedReceipts = bundle.manifest.sourceCounts.attachments - counts.attachments;
  const countItems = [
    { label: "Categories", value: counts.categories },
    { label: "Tags", value: counts.tags },
    { label: "Members", value: counts.members },
    { label: "Expenses", value: counts.expenses },
    { label: "Payments", value: counts.settlements },
    { label: "Receipts", value: counts.attachments },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleImport)} className="flex min-w-0 flex-col gap-5">
        <header className="flex min-w-0 items-center gap-4">
          <span className="import-group-icon" aria-hidden="true">
            <EmojiImage icon={bundle.group.icon} />
          </span>
          <div className="min-w-0">
            <p className="eyebrow mb-1">TRANSFER REVIEW</p>
            <h1 className="page-title break-words">Import {bundle.group.name}</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              A new editable group named{" "}
              <strong className="text-[var(--ink)]">{destinationName}</strong> will be created.
            </p>
          </div>
        </header>

        <section aria-labelledby="import-counts-heading" className="surface surface-pad">
          <h2 id="import-counts-heading" className="section-title">
            Verified transfer contents
          </h2>
          <p className="soft-caption mt-1">
            Only the selected contents in this transfer will be imported.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {countItems.map((item) => (
              <div key={item.label} className="rounded-xl bg-[var(--surface-soft)] px-3 py-3">
                <dt className="soft-caption">{item.label}</dt>
                <dd className="mt-1 text-xl font-bold tabular">{item.value}</dd>
              </div>
            ))}
          </dl>
          {omittedReceipts > 0 && (
            <StatusBanner variant="warning" className="mt-4">
              {omittedReceipts} source receipt {omittedReceipts === 1 ? "was" : "were"}{" "}
              intentionally omitted when this transfer was created.
            </StatusBanner>
          )}
        </section>

        {bundle.members.length > 0 && (
          <fieldset className="surface surface-pad min-w-0">
            <legend className="sr-only">Which member are you?</legend>
            <h2 className="section-title">Which member are you?</h2>
            <p className="soft-caption mt-1">Choose your name so your balances stay with you.</p>
            <div className="mt-4 flex flex-col gap-2">
              {bundle.members.map((member) => (
                <label key={member.id} className="import-member-option">
                  <input
                    type="radio"
                    value={member.id}
                    {...methods.register("memberId")}
                    className="choice-control"
                  />
                  <span className="min-w-0 truncate font-semibold">{memberName(member.id)}</span>
                </label>
              ))}
              <label className="import-member-option">
                <input
                  type="radio"
                  value="new"
                  {...methods.register("memberId")}
                  className="choice-control"
                />
                <span className="font-semibold">I’m not listed</span>
              </label>
            </div>
            {methods.formState.errors.memberId && (
              <StatusBanner variant="error" className="mt-3">
                {methods.formState.errors.memberId.message}
              </StatusBanner>
            )}
          </fieldset>
        )}

        {memberId === "new" && !localUser && (
          <section className="surface surface-pad flex min-w-0 flex-col gap-4">
            <div>
              <h2 className="section-title">Create your identity</h2>
              <p className="soft-caption mt-1">You will be added as a member of this group.</p>
            </div>
            <div>
              <label className="field-label" htmlFor="import-identity-name">
                Your name
              </label>
              <Input id="import-identity-name" name="name" placeholder="Enter your name" />
            </div>
            <div>
              <p className="field-label">Pick an icon</p>
              <EmojiPicker name="icon" kind="profile" emojis={PERSON_EMOJIS} />
            </div>
          </section>
        )}

        {memberId === "new" && localUser && (
          <p className="note">
            {localUser.name} will be added as a new member of the imported group.
          </p>
        )}
        {!bundle.categories.length && (
          <p className="note">
            No categories were transferred. Your default categories will be created.
          </p>
        )}
        {error && <StatusBanner variant="error">{error}</StatusBanner>}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="soft-caption">Nothing is imported until you confirm.</p>
          <button type="submit" disabled={importing} className="btn btn-primary !px-7">
            {importing ? "Importing…" : "Import group"}
          </button>
        </div>
      </form>
      {conflicts && (
        <ResolvePersonIdentities
          conflicts={conflicts}
          sourceGroupName={bundle.group.name}
          existingGroups={existingGroups}
          pending={importing}
          error={error}
          onCancel={handleCancelPeople}
          onConfirm={handleConfirmPeople}
        />
      )}
    </FormProvider>
  );
};

export default ImportReview;
