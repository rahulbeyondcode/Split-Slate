import Dexie, { type EntityTable } from "dexie";

import type {
  Attachment,
  Category,
  Expense,
  Group,
  LocalUser,
  Member,
  OnboardingProgress,
} from "@/shared/types/domain.types";

class SplitSlateDatabase extends Dexie {
  localUser!: EntityTable<LocalUser, "id">;
  groups!: EntityTable<Group, "id">;
  members!: EntityTable<Member, "id">;
  categories!: EntityTable<Category, "id">;
  expenses!: EntityTable<Expense, "expenseId">;
  attachments!: EntityTable<Attachment, "id">;
  onboarding!: EntityTable<OnboardingProgress, "id">;

  constructor() {
    super("split-slate");
    this.version(1).stores({
      localUser: "id",
      groups: "id",
      members: "id, groupId",
      categories: "id, groupId",
      expenses: "expenseId, groupId",
      attachments: "id, expenseId",
      onboarding: "id",
    });
  }
}

export const db = new SplitSlateDatabase();
