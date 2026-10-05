import Dexie, { type EntityTable } from "dexie";

import type {
  ActivityEvent,
  Attachment,
  Category,
  Expense,
  Group,
  LocalUser,
  Member,
  Person,
  SettingsRecord,
  Settlement,
  Tag,
} from "@/shared/types/domain.types";

class SplitSlateDatabase extends Dexie {
  activityEvents!: EntityTable<ActivityEvent, "id">;
  localUser!: EntityTable<LocalUser, "id">;
  groups!: EntityTable<Group, "id">;
  people!: EntityTable<Person, "id">;
  members!: EntityTable<Member, "id">;
  categories!: EntityTable<Category, "id">;
  tags!: EntityTable<Tag, "id">;
  expenses!: EntityTable<Expense, "expenseId">;
  settlements!: EntityTable<Settlement, "id">;
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
      tags: "id, groupId",
      expenses: "expenseId, groupId",
      attachments: "id, expenseId",
      settings: "id",
    });
    this.version(2).stores({ activityEvents: "id, groupId, [kind+subjectId], createdAt" });
    this.version(3).stores({ settlements: "id, groupId" });
  }
}

export const db = new SplitSlateDatabase();
