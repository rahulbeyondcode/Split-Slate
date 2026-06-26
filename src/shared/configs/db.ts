import Dexie, { type EntityTable } from "dexie";

import type {
  Attachment,
  Category,
  Expense,
  Group,
  LocalUser,
  Member,
  Person,
  SettingsRecord,
} from "@/shared/types/domain.types";

class SplitSlateDatabase extends Dexie {
  localUser!: EntityTable<LocalUser, "id">;
  groups!: EntityTable<Group, "id">;
  people!: EntityTable<Person, "id">;
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
      people: "id",
      members: "id, groupId, personId",
      categories: "id, groupId",
      expenses: "expenseId, groupId",
      attachments: "id, expenseId",
      settings: "id",
    });
  }
}

export const db = new SplitSlateDatabase();
