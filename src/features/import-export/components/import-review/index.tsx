import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { importGroupTransfer } from "@/features/import-export/store";
import {
  type ImportIdentityFormValues,
  importIdentitySchema,
} from "@/features/import-export/utils/import-identity-schema";
import { useStore } from "@/shared/configs/store";

import { PERSON_EMOJIS } from "@/shared/constants/emojis";
import type {
  GroupTransferSource,
  ImportIdentity,
} from "@/features/import-export/types/import-export.types";
import type { Group } from "@/shared/types/domain.types";

interface PropsType {
  source: GroupTransferSource;
  onImported: (group: Group) => void;
}

const ImportReview = ({ source, onImported }: PropsType) => {
  const { bundle } = source;
  const { localUser, groups, init } = useStore();
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

  const handleImport = async (values: ImportIdentityFormValues) => {
    setImporting(true);
    setError("");
    try {
      const identity: ImportIdentity =
        values.memberId === "new"
          ? { type: "new", name: values.name, icon: values.icon }
          : { type: "member", memberId: values.memberId };
      const result = await importGroupTransfer({ source, identity });
      await init();
      onImported(result.group);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not import this group");
      setImporting(false);
    }
  };

  const counts = bundle.manifest.includedCounts;
  const omittedReceipts = bundle.manifest.sourceCounts.attachments - counts.attachments;

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleImport)} className="flex flex-col gap-6">
        <header>
          <p className="text-4xl" aria-hidden="true">
            {bundle.group.icon}
          </p>
          <h1 className="mt-2 text-2xl font-bold">Import {bundle.group.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            A new editable group named <strong>{destinationName}</strong> will be created.
          </p>
        </header>

        <section aria-labelledby="import-counts-heading" className="rounded border p-4">
          <h2 id="import-counts-heading" className="font-semibold">
            Verified transfer contents
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            <div>
              <dt className="text-gray-500">Categories</dt>
              <dd>{counts.categories}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Tags</dt>
              <dd>{counts.tags}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Members</dt>
              <dd>{counts.members}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Expenses</dt>
              <dd>{counts.expenses}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Receipts</dt>
              <dd>{counts.attachments}</dd>
            </div>
          </dl>
          {omittedReceipts > 0 && (
            <p className="mt-3 text-sm text-amber-800">
              {omittedReceipts} source receipt {omittedReceipts === 1 ? "was" : "were"}{" "}
              intentionally omitted when this transfer was created.
            </p>
          )}
        </section>

        {bundle.members.length > 0 && (
          <fieldset className="flex flex-col gap-2 rounded border p-4">
            <legend className="px-1 font-semibold">Which member are you?</legend>
            {bundle.members.map((member) => (
              <label key={member.id} className="flex items-center gap-2 text-sm">
                <input type="radio" value={member.id} {...methods.register("memberId")} />
                {memberName(member.id)}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="new" {...methods.register("memberId")} />
              I’m not listed
            </label>
            {methods.formState.errors.memberId && (
              <p role="alert" className="text-sm text-red-700">
                {methods.formState.errors.memberId.message}
              </p>
            )}
          </fieldset>
        )}

        {memberId === "new" && !localUser && (
          <section className="flex flex-col gap-4 rounded border p-4">
            <div>
              <h2 className="font-semibold">Create your identity</h2>
              <p className="text-sm text-gray-600">You will be added as a member of this group.</p>
            </div>
            <label className="text-sm font-medium">
              Your name
              <Input name="name" placeholder="Enter your name" wrapperClass="mt-1" />
            </label>
            <div>
              <p className="text-sm font-medium">Pick an icon</p>
              <EmojiPicker name="icon" emojis={PERSON_EMOJIS} />
            </div>
          </section>
        )}

        {memberId === "new" && localUser && (
          <p className="rounded border border-blue-200 p-3 text-sm text-blue-800">
            {localUser.name} will be added as a new member of the imported group.
          </p>
        )}
        {!bundle.categories.length && (
          <p className="rounded border border-blue-200 p-3 text-sm text-blue-800">
            No categories were transferred. Your default categories will be created.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={importing}
          className="self-start rounded bg-gray-900 px-5 py-2 text-sm text-white disabled:opacity-60"
        >
          {importing ? "Importing…" : "Import group"}
        </button>
      </form>
    </FormProvider>
  );
};

export default ImportReview;
