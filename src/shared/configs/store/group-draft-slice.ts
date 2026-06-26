import type { GroupDraftSlice, SliceCreator } from "./types";

export const createGroupDraftSlice: SliceCreator<GroupDraftSlice> = (set) => ({
  groupDraft: null,

  setGroupDraft: (draft) => {
    set({ groupDraft: draft });
  },

  clearGroupDraft: () => {
    set({ groupDraft: null });
  },
});
