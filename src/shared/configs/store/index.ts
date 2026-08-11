import { create } from "zustand";

import { createAppSlice } from "@/shared/configs/store/app-slice";
import { createCategoriesSlice } from "@/shared/configs/store/categories-slice";
import { createGroupDraftSlice } from "@/shared/configs/store/group-draft-slice";
import { createGroupsSlice } from "@/shared/configs/store/groups-slice";
import { createOnboardingSlice } from "@/shared/configs/store/onboarding-slice";
import { createPeopleSlice } from "@/shared/configs/store/people-slice";
import { createTagsSlice } from "@/shared/configs/store/tags-slice";

import type { AppStore } from "@/shared/configs/store/types";

export const useStore = create<AppStore>()((...args) => ({
  ...createAppSlice(...args),
  ...createPeopleSlice(...args),
  ...createGroupsSlice(...args),
  ...createCategoriesSlice(...args),
  ...createTagsSlice(...args),
  ...createOnboardingSlice(...args),
  ...createGroupDraftSlice(...args),
}));
