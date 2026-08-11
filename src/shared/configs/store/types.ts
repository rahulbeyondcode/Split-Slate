import type { StateCreator } from "zustand";

import type {
  Category,
  Expense,
  Group,
  GroupDraft,
  LocalUser,
  Member,
  OnboardingSettings,
  Person,
  SetupStep,
} from "@/shared/types/domain.types";

export interface AppSlice {
  expenses: Expense[];
  initialized: boolean;

  init: () => Promise<void>;
  removeTagFromGroupExpenses: (groupId: string, tag: string) => Promise<void>;
}

export interface PeopleSlice {
  localUser: LocalUser | null;
  people: Person[];

  setLocalUser: (name: string, icon: string) => Promise<LocalUser>;
  addPerson: (name: string, icon: string) => Promise<Person>;
  updatePerson: (personId: string, patch: Partial<Omit<Person, "id">>) => Promise<Person>;
  removePerson: (personId: string) => Promise<void>;
}

export interface GroupsSlice {
  groups: Group[];
  members: Member[];

  createGroup: (
    name: string,
    icon: string,
    currency: string,
  ) => Promise<{ group: Group; creatorMember: Member }>;
  updateGroup: (groupId: string, patch: Partial<Group>) => Promise<Group>;
  addMember: (groupId: string, personId: string) => Promise<Member>;
  removeMember: (memberId: string) => Promise<void>;
}

export interface CategoriesSlice {
  categories: Category[];
  masterCategories: { name: string; icon: string }[];
  defaultGroupCategories: string[];

  addCategory: (groupId: string, name: string, icon: string) => Promise<Category>;
  updateCategory: (categoryId: string, patch: Partial<Omit<Category, "id">>) => Promise<Category>;
  removeCategory: (categoryId: string) => Promise<void>;
}

export interface OnboardingSlice {
  onboardingStep: SetupStep;
  onboardingLastCompletedStep: SetupStep | null;
  onboardingGroupId: string | null;
  onboardingComplete: boolean;

  updateOnboarding: (patch: Partial<Omit<OnboardingSettings, "id">>) => Promise<void>;
  advanceOnboarding: (fromStep: SetupStep) => Promise<void>;
  setOnboardingStep: (step: SetupStep) => void;
}

export interface GroupDraftSlice {
  groupDraft: GroupDraft | null;

  setGroupDraft: (draft: GroupDraft | null) => void;
  clearGroupDraft: () => void;
}

export type AppStore = AppSlice &
  PeopleSlice &
  GroupsSlice &
  CategoriesSlice &
  OnboardingSlice &
  GroupDraftSlice;

export type SliceCreator<T> = StateCreator<AppStore, [], [], T>;
