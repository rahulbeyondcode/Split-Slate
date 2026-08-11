import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useOutletContext } from "react-router-dom";
import { z } from "zod";

import ColorPicker from "@/shared/components/color-picker";
import Input from "@/shared/components/form-elements/input";

import { useStore } from "@/shared/configs/store";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Tag } from "@/shared/types/domain.types";

const tagFormSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid tag color"),
});

type TagFormValues = z.infer<typeof tagFormSchema>;
type TagMode = "add" | "edit" | null;

const DEFAULT_TAG_COLOR = "#6366f1";

const TagManagement = () => {
  const { group, groupTags, groupExpenses } = useOutletContext<GroupDetailContext>();
  const { addTag, updateTag, removeTag } = useStore();
  const [tagMode, setTagMode] = useState<TagMode>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
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

  const handleDeleteTag = async (tag: Tag) => {
    setTagError(null);
    const expenseCount = groupExpenses.filter((expense) => expense.tagIds.includes(tag.id)).length;
    const confirmed = window.confirm(
      `This tag will be removed from ${expenseCount} expense(s). The expenses will not be deleted.`,
    );
    if (!confirmed) return;

    try {
      await removeTag(tag.id);
      if (editingTagId === tag.id) handleCancelTagForm();
    } catch (error) {
      setTagError(error instanceof Error ? error.message : "Could not delete this tag");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Tags</h3>
          <p className="text-sm text-gray-500">{groupTags.length} available</p>
        </div>
        {tagMode !== "add" && (
          <button
            type="button"
            onClick={handleAddTagClick}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded shrink-0"
          >
            Add tag
          </button>
        )}
      </div>

      {tagError && <p className="text-sm text-red-500">{tagError}</p>}

      {tagMode && (
        <FormProvider {...tagForm}>
          <form onSubmit={handleSaveTag} className="flex flex-col gap-2 border rounded p-3">
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-900 text-white text-sm rounded disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : tagSubmitLabel}
              </button>
            </div>
          </form>
        </FormProvider>
      )}

      {groupTags.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {groupTags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between gap-3 rounded border border-gray-200 px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden="true"
                />
                {tag.name}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleEditTag(tag)}
                  className="text-xs font-medium text-gray-600"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag)}
                  className="text-xs font-medium text-red-500"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No tags have been added yet.</p>
      )}
    </div>
  );
};

export default TagManagement;
