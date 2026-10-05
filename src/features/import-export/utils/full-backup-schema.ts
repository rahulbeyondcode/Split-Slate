import { z } from "zod";

import { sealPortableGroup } from "@/features/import-export/utils/transfer-integrity";

import { CURRENCIES } from "@/shared/constants/currencies";
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
  Tag,
} from "@/shared/types/domain.types";

const text = z
  .string()
  .min(1)
  .refine((value) => Boolean(value.trim()));
const id = text;
const timestamp = z.number().int().safe().nonnegative();
const amount = z.number().int().safe().nonnegative();
const person = z.strictObject({ id, name: text, icon: text });
const group = z.strictObject({
  id,
  name: text,
  icon: text,
  currency: z.string().refine((value) => CURRENCIES.some((item) => item.code === value)),
  createdAt: timestamp,
  frequentPayerIds: z.array(id),
});
const member = z.strictObject({ id, groupId: id, personId: id });
const category = z.strictObject({ id, groupId: id, name: text, icon: text, isActive: z.boolean() });
const tag = z.strictObject({
  id,
  groupId: id,
  name: text,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/u),
});
const transaction = z.strictObject({ memberId: id, amount });
const expense = z.strictObject({
  expenseId: id,
  groupId: id,
  expenseName: text,
  createdBy: id,
  categoryId: id,
  createdAt: timestamp,
  when: z.number().int().safe(),
  splitType: z.enum(["equal", "amount", "shares", "percentage", "adjustment"]),
  splitMeta: z.array(z.strictObject({ memberId: id, value: z.union([text, z.number().finite()]) })),
  transactions: z.strictObject({ paid: z.array(transaction), owes: z.array(transaction) }),
  tagIds: z.array(id),
  attachmentIds: z.array(id),
});
const attachment = z.strictObject({
  id,
  expenseId: id,
  mimeType: text,
  createdAt: timestamp,
  path: z.string().regex(/^receipts\/[1-9]\d*\.bin$/u),
  size: amount,
  sha256: z.string().regex(/^[0-9a-f]{64}$/u),
});
const activityEvent = z.strictObject({
  id,
  groupId: id.nullable(),
  groupName: text,
  subjectId: id.nullable(),
  kind: z.enum(["expense", "category", "tag", "group", "member", "person"]),
  action: z.enum(["created", "updated", "deleted", "imported"]),
  label: text,
  icon: text,
  amount: amount.nullable(),
  currency: text.nullable(),
  createdAt: timestamp,
});
const settings = z.discriminatedUnion("id", [
  z.strictObject({
    id: z.literal("onboarding"),
    complete: z.literal(true),
    lastCompletedStep: z.enum(["identity", "group", "currency", "categories", "members"]),
    groupId: id.nullable(),
  }),
  z.strictObject({
    id: z.literal("categories"),
    master: z.array(z.strictObject({ name: text, icon: text })),
    default: z.array(text),
  }),
]);

export const fullBackupDataSchema = z.strictObject({
  format: z.literal("split-slate-full-backup"),
  version: z.literal(1),
  createdAt: timestamp,
  theme: z.enum(["light", "dark"]),
  localUser: z.array(person).length(1),
  groups: z.array(group),
  people: z.array(person),
  members: z.array(member),
  categories: z.array(category),
  tags: z.array(tag),
  expenses: z.array(expense),
  activityEvents: z.array(activityEvent).optional(),
  attachments: z.array(attachment),
  settings: z.array(settings).length(2),
});

export type FullBackupData = z.infer<typeof fullBackupDataSchema>;

export interface FullBackupSource {
  activityEvents: ActivityEvent[];
  localUser: LocalUser[];
  groups: Group[];
  people: Person[];
  members: Member[];
  categories: Category[];
  tags: Tag[];
  expenses: Expense[];
  attachments: Attachment[];
  settings: SettingsRecord[];
}

export interface FullBackupSnapshot {
  data: FullBackupData;
  attachments: Attachment[];
}

const unique = (ids: string[], label: string) => {
  if (new Set(ids).size !== ids.length) throw new Error(`Backup has duplicate ${label}`);
};

export const validateFullBackupData = async (value: unknown): Promise<FullBackupData> => {
  const data = fullBackupDataSchema.parse(value);
  unique(
    data.localUser.map((item) => item.id),
    "local users",
  );
  unique(
    data.groups.map((item) => item.id),
    "groups",
  );
  unique(
    data.people.map((item) => item.id),
    "people",
  );
  unique(
    data.members.map((item) => item.id),
    "members",
  );
  unique(
    data.categories.map((item) => item.id),
    "categories",
  );
  unique(
    data.tags.map((item) => item.id),
    "tags",
  );
  unique(
    data.expenses.map((item) => item.expenseId),
    "expenses",
  );
  unique(
    data.attachments.map((item) => item.id),
    "receipts",
  );
  unique(
    (data.activityEvents ?? []).map((item) => item.id),
    "activity events",
  );
  unique(
    data.attachments.map((item) => item.path),
    "receipt paths",
  );
  unique(
    data.settings.map((item) => item.id),
    "settings",
  );

  const self = data.localUser[0];
  const selfPerson = data.people.find((item) => item.id === self.id);
  if (selfPerson?.name !== self.name || selfPerson.icon !== self.icon) {
    throw new Error("Backup identity does not match the people directory");
  }
  const onboarding = data.settings.find((item) => item.id === "onboarding");
  if (
    !onboarding ||
    (onboarding.groupId !== null && !data.groups.some((item) => item.id === onboarding.groupId))
  ) {
    throw new Error("Backup onboarding group is missing");
  }
  if (data.settings.length !== 2 || !data.settings.some((item) => item.id === "categories")) {
    throw new Error("Backup settings are incomplete");
  }
  unique(
    data.members.map((item) => `${item.groupId}\u0000${item.personId}`),
    "group memberships",
  );

  const groupIds = new Set(data.groups.map((item) => item.id));
  const peopleIds = new Set(data.people.map((item) => item.id));
  if (data.members.some((item) => !groupIds.has(item.groupId) || !peopleIds.has(item.personId))) {
    throw new Error("Backup member references are incomplete");
  }
  if (
    [...data.categories, ...data.tags, ...data.expenses].some((item) => !groupIds.has(item.groupId))
  ) {
    throw new Error("Backup has records outside its groups");
  }
  const expenseIds = new Set(data.expenses.map((item) => item.expenseId));
  if (data.attachments.some((item) => !expenseIds.has(item.expenseId))) {
    throw new Error("Backup receipt expense is missing");
  }

  // Reuse the full group-transfer validator for split math and all in-group references.
  for (const currentGroup of data.groups) {
    const members = data.members.filter((item) => item.groupId === currentGroup.id);
    const memberPeople = new Set(members.map((item) => item.personId));
    const categories = data.categories.filter((item) => item.groupId === currentGroup.id);
    const tags = data.tags.filter((item) => item.groupId === currentGroup.id);
    const expenses = data.expenses.filter((item) => item.groupId === currentGroup.id);
    const currentExpenseIds = new Set(expenses.map((item) => item.expenseId));
    const attachments = data.attachments
      .filter((item) => currentExpenseIds.has(item.expenseId))
      .map(({ id: attachmentId, expenseId, mimeType, createdAt }) => ({
        id: attachmentId,
        expenseId,
        mimeType,
        createdAt,
      }));
    const counts = {
      categories: categories.length,
      tags: tags.length,
      members: members.length,
      expenses: expenses.length,
      attachments: attachments.length,
    };
    await sealPortableGroup({
      schemaVersion: 1,
      manifest: {
        selection: {
          categories: true,
          tags: true,
          members: true,
          expenses: true,
          attachments: true,
        },
        sourceCounts: counts,
        includedCounts: counts,
      },
      group: currentGroup,
      people: data.people.filter((item) => memberPeople.has(item.id)),
      members,
      categories,
      tags,
      expenses,
      attachments,
    });
  }
  return data;
};
