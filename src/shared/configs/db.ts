import Dexie, { type EntityTable } from "dexie";

import type {
  Attachment,
  Category,
  Expense,
  Group,
  LocalUser,
  Member,
  SettingsRecord,
} from "@/shared/types/domain.types";

class SplitSlateDatabase extends Dexie {
  localUser!: EntityTable<LocalUser, "id">;
  groups!: EntityTable<Group, "id">;
  members!: EntityTable<Member, "id">;
  categories!: EntityTable<Category, "id">;
  expenses!: EntityTable<Expense, "expenseId">;
  attachments!: EntityTable<Attachment, "id">;
  settings!: EntityTable<SettingsRecord, "id">;

  constructor() {
    super("split-slate");
    this.version(1).stores({
      localUser: "id",
      groups: "id",
      members: "id, groupId",
      categories: "id, groupId",
      expenses: "expenseId, groupId",
      attachments: "id, expenseId",
      settings: "id",
    });
  }
}

export const db = new SplitSlateDatabase();
