import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useOutletContext } from "react-router-dom";
import { z } from "zod";

import ColorPicker from "@/shared/components/color-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Tag } from "@/shared/types/domain.types";

import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import Icon from "@/shared/ui/icon";

const tagFormSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid tag color"),
});

type TagFormValues = z.infer<typeof tagFormSchema>;
type TagMode = "add" | "edit" | null;

const DEFAULT_TAG_COLOR = "#6366f1";

const TagManagement = () => {
  const { group, groupTags, groupExpenses } = useOutletContext<GroupDetailContext>();
  const { addTag, updateTag, removeTag } = useStore();
  const [tagMode, setTagMode] = useState<TagMode>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [confirmTagId, setConfirmTagId] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const tagForm = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: { name: "", color: DEFAULT_TAG_COLOR },
  });
  const { isSubmitting } = tagForm.formState;
  const tagFormTitle = tagMode === "edit" ? "Edit tag" : "Add tag";
  const tagSubmitLabel = tagMode === "edit" ? "Save" : "Add";

  const findDuplicateTag = (name: string) =>
    groupTags.some(
      (tag) => tag.id !== editingTagId && tag.name.toLowerCase() === name.toLowerCase(),
    );

  const handleAddTagClick = () => {
    setTagError(null);
    setTagMode("add");
    setEditingTagId(null);
    tagForm.reset({ name: "", color: DEFAULT_TAG_COLOR });
  };

  const handleEditTag = (tag: Tag) => {
    setTagError(null);
    setTagMode("edit");
    setEditingTagId(tag.id);
    tagForm.reset({ name: tag.name, color: tag.color });
  };

  const handleCancelTagForm = () => {
    setTagError(null);
    setTagMode(null);
    setEditingTagId(null);
    tagForm.reset({ name: "", color: DEFAULT_TAG_COLOR });
  };

  const handleSaveTag = tagForm.handleSubmit(async (values) => {
    setTagError(null);
    if (findDuplicateTag(values.name)) {
      tagForm.setError("name", { message: "Tag already exists" });
      return;
    }

    try {
      if (tagMode === "edit" && editingTagId) {
        await updateTag(editingTagId, { name: values.name, color: values.color });
      } else {
        await addTag(group.id, values.name, values.color);
      }
      handleCancelTagForm();
    } catch (error) {
      setTagError(error instanceof Error ? error.message : "Could not save this tag");
    }
  });

  const handleDeleteTag = (tag: Tag) => {
    setTagError(null);
    setConfirmTagId(tag.id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTagId) return;
    await removeTag(confirmTagId);
    if (editingTagId === confirmTagId) handleCancelTagForm();
    setConfirmTagId(null);
  };
  const confirmTag = groupTags.find((tag) => tag.id === confirmTagId);
  const confirmTagExpenseCount = groupExpenses.filter((expense) =>
    expense.tagIds.includes(confirmTagId ?? ""),
  ).length;

  return (
    <div className="surface surface-pad flex flex-col gap-3">
      <div className="management-card-header flex items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Tags</h2>
          <p className="soft-caption">{groupTags.length} available · free-form · group-scoped</p>
        </div>
        {tagMode !== "add" && (
          <button type="button" onClick={handleAddTagClick} className="btn btn-secondary">
            <Icon icon={Plus} size={18} /> Add tag
          </button>
        )}
      </div>

      <div className="management-card-content">
        {tagError && (
          <p role="alert" className="note money-negative">
            {tagError}
          </p>
        )}
        <ConfirmationDialog
          open={Boolean(confirmTag)}
          title={`Delete ${confirmTag?.name ?? "tag"}?`}
          description={`This tag will be removed from ${confirmTagExpenseCount} ${confirmTagExpenseCount === 1 ? "expense" : "expenses"}. The expenses will not be deleted.`}
          confirmLabel="Delete tag"
          onCancel={() => setConfirmTagId(null)}
          onConfirm={handleConfirmDelete}
        />

        {tagMode && (
          <FormProvider {...tagForm}>
            <form onSubmit={handleSaveTag} className="note flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-900">{tagFormTitle}</p>
              <Input name="name" placeholder="Tag name" autoFocus />
              <ColorPicker name="color" label="Tag color" />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelTagForm}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? "Saving..." : tagSubmitLabel}
                </button>
              </div>
            </form>
          </FormProvider>
        )}

        {groupTags.length > 0 ? (
          <ul>
            {groupTags.map((tag) => (
              <li key={tag.id} className="ui-row management-entry tag-entry flex-wrap">
                <span className="management-entry-identity flex min-w-0 flex-1 basis-40 items-center gap-2 text-sm font-medium text-gray-900">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 truncate">{tag.name}</span>
                </span>
                <div className="management-entry-actions ml-auto flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleEditTag(tag)}
                    className="btn btn-secondary !px-3"
                  >
                    <Icon icon={Pencil} size={17} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag)}
                    className="btn btn-danger !px-3"
                  >
                    <Icon icon={Trash2} size={17} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No tags have been added yet.</p>
        )}
      </div>
    </div>
  );
};

export default TagManagement;
