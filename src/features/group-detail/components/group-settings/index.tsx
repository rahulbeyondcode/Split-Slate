import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, useOutletContext } from "react-router-dom";
import { z } from "zod";

import ExportPanel from "@/features/import-export/components/export-panel";
import EmojiPicker from "@/shared/components/emoji-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";
import { createRequiredStringSchema } from "@/shared/utils/string-validation";

import { GROUP_EMOJIS } from "@/shared/constants/emojis";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import Avatar from "@/shared/ui/avatar";
import Surface from "@/shared/ui/surface";

const schema = z.object({
  name: createRequiredStringSchema("Group name is required"),
  icon: createRequiredStringSchema("Choose a group icon"),
});
type Values = z.infer<typeof schema>;

const GroupSettings = () => {
  const { group, groupExpenses, groupMembers } = useOutletContext<GroupDetailContext>();
  const updateGroup = useStore((state) => state.updateGroup);
  const [editing, setEditing] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState("");
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: group.name, icon: group.icon },
  });
  const handleSave = methods.handleSubmit(async (values) => {
    setError("");
    try {
      await updateGroup(group.id, values);
      setEditing(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not update group");
    }
  });

  return (
    <section className="flex flex-col gap-5">
      {editing ? (
        <FormProvider {...methods}>
          <form onSubmit={handleSave} className="surface surface-pad flex flex-col gap-4">
            <h2 className="section-title">Edit name & icon</h2>
            <label>
              <span className="field-label">Group name</span>
              <Input name="name" />
            </label>
            <label>
              <span className="field-label">Group icon</span>
              <EmojiPicker name="icon" emojis={GROUP_EMOJIS} />
            </label>
            {error && (
              <p role="alert" className="note money-negative">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={methods.formState.isSubmitting}
              >
                Save changes
              </button>
            </div>
          </form>
        </FormProvider>
      ) : (
        <Surface className="surface-pad flex items-center gap-3">
          <Avatar icon={group.icon} square />
          <div className="flex-1">
            <p className="font-bold">{group.name}</p>
            <p className="soft-caption">
              {groupMembers.length} members · {groupExpenses.length} expenses · created{" "}
              {new Intl.DateTimeFormat(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(group.createdAt)}
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
            ✎ Edit name & icon
          </button>
        </Surface>
      )}
      <Surface className="surface-pad">
        <div className="ui-row">
          <Avatar icon="₹" square />
          <div className="flex-1">
            <p className="font-bold">Currency</p>
            <p className="soft-caption">One currency per group</p>
          </div>
          <span className="chip">{group.currency}</span>
        </div>
        <div className="ui-row">
          <Avatar icon="⇧" square />
          <div className="flex-1">
            <p className="font-bold">Export</p>
            <p className="soft-caption">Transfer selected group data via Link, CSV or ZIP</p>
          </div>
          <button
            type="button"
            onClick={() => setShowExport((value) => !value)}
            aria-expanded={showExport}
            className="btn btn-secondary"
          >
            {showExport ? "Hide export" : "Export group"}
          </button>
        </div>
        <div className="ui-row">
          <Avatar icon="⇩" square />
          <div className="flex-1">
            <p className="font-bold">Import</p>
            <p className="soft-caption">Bring in a CSV or ZIP as a new group</p>
          </div>
          <Link to="/import" className="btn btn-secondary">
            Import group
          </Link>
        </div>
      </Surface>
      {showExport && (
        <Surface className="surface-pad">
          <ExportPanel
            groupId={group.id}
            groupName={group.name}
            attachmentCount={groupExpenses.reduce(
              (count, expense) => count + expense.attachmentIds.length,
              0,
            )}
          />
        </Surface>
      )}
      <p className="note">
        Group deletion is not available yet. Export a backup before making permanent changes to
        expenses or members.
      </p>
    </section>
  );
};

export default GroupSettings;
