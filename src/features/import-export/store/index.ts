import { v4 as uuid } from "uuid";

import { validateFullBackupSnapshot } from "@/features/import-export/utils/full-backup";
import type {
  FullBackupSnapshot,
  FullBackupSource,
} from "@/features/import-export/utils/full-backup-schema";
import { planPersonImport } from "@/features/import-export/utils/person-conflicts";
import { verifyPortableGroup } from "@/features/import-export/utils/transfer-integrity";
import { db } from "@/shared/configs/db";
import { normalizeRequiredString } from "@/shared/utils/string-validation";

import {
  SEED_DEFAULT_GROUP_CATEGORIES,
  SEED_MASTER_CATEGORIES,
} from "@/shared/constants/categories";
import type {
  GroupExportSource,
  ImportGroupInput,
  ImportGroupResult,
} from "@/features/import-export/types/import-export.types";
import type {
  Attachment,
  Category,
  CategorySettings,
  Expense,
  Group,
  LocalUser,
  Member,
  OnboardingSettings,
  Person,
  Tag,
} from "@/shared/types/domain.types";

export const readGroupExportSource = async (groupId: string): Promise<GroupExportSource> =>
  db.transaction(
    "r",
    [db.groups, db.people, db.members, db.categories, db.tags, db.expenses, db.attachments],
    async () => {
      const group = await db.groups.get(groupId);
      if (!group) throw new Error("Group not found");

      const [members, categories, tags, expenses] = await Promise.all([
        db.members.where("groupId").equals(groupId).toArray(),
        db.categories.where("groupId").equals(groupId).toArray(),
        db.tags.where("groupId").equals(groupId).toArray(),
        db.expenses.where("groupId").equals(groupId).toArray(),
      ]);
      const personIds = [...new Set(members.map((member) => member.personId))];
      const people = personIds.length ? await db.people.bulkGet(personIds) : [];
      if (people.some((person) => !person)) throw new Error("A referenced person is missing");

      const expenseIds = expenses.map((expense) => expense.expenseId);
      const attachmentFiles = expenseIds.length
        ? await db.attachments.where("expenseId").anyOf(expenseIds).toArray()
        : [];
      const attachmentOwners = new Map<string, string>();
      for (const expense of expenses) {
        for (const attachmentId of expense.attachmentIds) {
          if (attachmentOwners.has(attachmentId)) {
            throw new Error("An attachment is referenced more than once");
          }
          attachmentOwners.set(attachmentId, expense.expenseId);
        }
      }
      if (
        attachmentOwners.size !== attachmentFiles.length ||
        attachmentFiles.some(
          (attachment) => attachmentOwners.get(attachment.id) !== attachment.expenseId,
        )
      ) {
        throw new Error("Persisted receipt references are inconsistent");
      }
      return {
        group,
        people: people as Person[],
        members,
        categories,
        tags,
        expenses,
        attachmentFiles,
      };
    },
  );

const nextGroupName = (requestedName: string, existingNames: Set<string>): string => {
  if (!existingNames.has(requestedName)) return requestedName;
  let suffix = 2;
  while (existingNames.has(`${requestedName} (${suffix})`)) suffix += 1;
  return `${requestedName} (${suffix})`;
};

export const importGroupTransfer = async ({
  source,
  identity,
  personResolutions,
  existingPersonRenames,
}: ImportGroupInput): Promise<ImportGroupResult> => {
  const bundle = await verifyPortableGroup(source.bundle);
  const filesById = new Map(
    source.attachmentFiles.map((attachment) => [attachment.id, attachment]),
  );
  if (
    filesById.size !== bundle.attachments.length ||
    bundle.attachments.some((metadata) => {
      const file = filesById.get(metadata.id);
      return (
        !file ||
        file.expenseId !== metadata.expenseId ||
        file.mimeType !== metadata.mimeType ||
        file.createdAt !== metadata.createdAt
      );
    })
  ) {
    throw new Error("Receipt files do not match the transfer manifest");
  }

  const selectedMember =
    identity.type === "member"
      ? bundle.members.find((member) => member.id === identity.memberId)
      : undefined;
  if (identity.type === "member" && !selectedMember) {
    throw new Error("Choose a valid transferred member");
  }

  return db.transaction(
    "rw",
    [
      db.localUser,
      db.groups,
      db.people,
      db.members,
      db.categories,
      db.tags,
      db.expenses,
      db.attachments,
      db.settings,
    ],
    async () => {
      const existingLocalUser = await db.localUser.toCollection().first();
      const onboarding = (await db.settings.get("onboarding")) as OnboardingSettings | undefined;
      let localUser: LocalUser;
      if (existingLocalUser) {
        localUser = existingLocalUser;
      } else if (selectedMember) {
        const person = bundle.people.find((item) => item.id === selectedMember.personId);
        if (!person) throw new Error("Selected member identity is missing");
        localUser = { id: uuid(), name: person.name, icon: person.icon };
      } else {
        localUser = {
          id: uuid(),
          name: normalizeRequiredString(
            identity.type === "new" ? (identity.name ?? "") : "",
            "Name is required",
          ),
          icon: normalizeRequiredString(
            identity.type === "new" ? (identity.icon ?? "") : "",
            "Icon is required",
          ),
        };
      }
      const selfPerson = { id: localUser.id, name: localUser.name, icon: localUser.icon };
      const existingPeople = (await db.people.toArray()).filter(
        (person) => person.id !== localUser.id,
      );
      existingPeople.push(selfPerson);
      const selectedPersonId = selectedMember?.personId;
      const personPlan = planPersonImport(
        bundle,
        existingPeople,
        localUser.id,
        selectedPersonId,
        personResolutions,
        existingPersonRenames,
      );
      await db.localUser.put(localUser);
      await db.people.put(selfPerson);
      for (const rename of personPlan.renames) {
        await db.people.update(rename.personId, { name: rename.name });
        if (rename.personId === localUser.id) {
          await db.localUser.update(localUser.id, { name: rename.name });
        }
      }
      if (personPlan.additions.length) await db.people.bulkAdd(personPlan.additions);

      const destinationGroupId = uuid();
      const existingNames = new Set((await db.groups.toArray()).map((group) => group.name));
      const groupName = nextGroupName(bundle.group.name, existingNames);
      const memberIds = new Map(bundle.members.map((member) => [member.id, uuid()]));
      const importedMembers: Member[] = bundle.members.map((member) => ({
        id: memberIds.get(member.id)!,
        groupId: destinationGroupId,
        personId: personPlan.ids.get(member.personId)!,
      }));
      let selfMember = selectedMember
        ? importedMembers.find((member) => member.id === memberIds.get(selectedMember.id))
        : importedMembers.find((member) => member.personId === localUser.id);
      if (!selfMember) {
        selfMember = { id: uuid(), groupId: destinationGroupId, personId: localUser.id };
        importedMembers.push(selfMember);
      }

      const categoryIds = new Map(bundle.categories.map((category) => [category.id, uuid()]));
      let importedCategories: Category[] = bundle.categories.map((category) => ({
        ...category,
        id: categoryIds.get(category.id)!,
        groupId: destinationGroupId,
      }));
      if (!importedCategories.length) {
        const categorySettings = (await db.settings.get("categories")) as
          | CategorySettings
          | undefined;
        const master = categorySettings?.master ?? SEED_MASTER_CATEGORIES;
        const defaults = categorySettings?.default ?? SEED_DEFAULT_GROUP_CATEGORIES;
        importedCategories = defaults.map((name) => ({
          id: uuid(),
          groupId: destinationGroupId,
          name,
          icon: master.find((category) => category.name === name)?.icon ?? "📦",
          isActive: true,
        }));
      }

      const tagIds = new Map(bundle.tags.map((tag) => [tag.id, uuid()]));
      const importedTags: Tag[] = bundle.tags.map((tag) => ({
        ...tag,
        id: tagIds.get(tag.id)!,
        groupId: destinationGroupId,
      }));
      const expenseIds = new Map(bundle.expenses.map((expense) => [expense.expenseId, uuid()]));
      const importedExpenses: Expense[] = bundle.expenses.map((expense) => ({
        ...expense,
        expenseId: expenseIds.get(expense.expenseId)!,
        groupId: destinationGroupId,
        createdBy: memberIds.get(expense.createdBy)!,
        categoryId: categoryIds.get(expense.categoryId)!,
        splitMeta: expense.splitMeta.map((row) => ({
          ...row,
          memberId: memberIds.get(row.memberId)!,
        })),
        transactions: {
          paid: expense.transactions.paid.map((row) => ({
            ...row,
            memberId: memberIds.get(row.memberId)!,
          })),
          owes: expense.transactions.owes.map((row) => ({
            ...row,
            memberId: memberIds.get(row.memberId)!,
          })),
        },
        tagIds: expense.tagIds.map((id) => tagIds.get(id)!),
        attachmentIds: expense.attachmentIds.map((id) => id),
      }));
      const attachmentIds = new Map(
        bundle.attachments.map((attachment) => [attachment.id, uuid()]),
      );
      for (const expense of importedExpenses) {
        const sourceExpense = bundle.expenses.find(
          (item) => expenseIds.get(item.expenseId) === expense.expenseId,
        )!;
        expense.attachmentIds = sourceExpense.attachmentIds.map((id) => attachmentIds.get(id)!);
      }
      const importedAttachments: Attachment[] = bundle.attachments.map((metadata) => ({
        id: attachmentIds.get(metadata.id)!,
        expenseId: expenseIds.get(metadata.expenseId)!,
        mimeType: metadata.mimeType,
        createdAt: metadata.createdAt,
        blob: filesById.get(metadata.id)!.blob,
      }));

      const mappedFrequentPayers = bundle.group.frequentPayerIds
        .map((id) => memberIds.get(id))
        .filter((id): id is string => Boolean(id));
      const group: Group = {
        ...bundle.group,
        id: destinationGroupId,
        name: groupName,
        frequentPayerIds: mappedFrequentPayers.length ? mappedFrequentPayers : [selfMember.id],
      };

      await db.groups.add(group);
      await db.members.bulkAdd(importedMembers);
      await db.categories.bulkAdd(importedCategories);
      if (importedTags.length) await db.tags.bulkAdd(importedTags);
      if (importedExpenses.length) await db.expenses.bulkAdd(importedExpenses);
      if (importedAttachments.length) await db.attachments.bulkAdd(importedAttachments);
      if (!existingLocalUser || !onboarding?.complete) {
        const completedOnboarding: OnboardingSettings = {
          id: "onboarding",
          complete: true,
          lastCompletedStep: "members",
          groupId: destinationGroupId,
        };
        await db.settings.put(completedOnboarding);
      }

      const [memberCount, categoryCount, tagCount, expenseCount, attachmentCount] =
        await Promise.all([
          db.members.where("groupId").equals(destinationGroupId).count(),
          db.categories.where("groupId").equals(destinationGroupId).count(),
          db.tags.where("groupId").equals(destinationGroupId).count(),
          db.expenses.where("groupId").equals(destinationGroupId).count(),
          importedAttachments.length
            ? db.attachments
                .where("expenseId")
                .anyOf(importedExpenses.map((item) => item.expenseId))
                .count()
            : Promise.resolve(0),
        ]);
      if (
        memberCount !== importedMembers.length ||
        categoryCount !== importedCategories.length ||
        tagCount !== importedTags.length ||
        expenseCount !== importedExpenses.length ||
        attachmentCount !== importedAttachments.length
      ) {
        throw new Error("Imported data could not be verified");
      }

      return { group, counts: bundle.manifest.includedCounts };
    },
  );
};

const backupTables = [
  db.localUser,
  db.groups,
  db.people,
  db.members,
  db.categories,
  db.tags,
  db.expenses,
  db.attachments,
  db.settings,
];

export const readFullBackupSource = async (): Promise<FullBackupSource> =>
  db.transaction("r", backupTables, async () => {
    const [localUser, groups, people, members, categories, tags, expenses, attachments, settings] =
      await Promise.all([
        db.localUser.toArray(),
        db.groups.toArray(),
        db.people.toArray(),
        db.members.toArray(),
        db.categories.toArray(),
        db.tags.toArray(),
        db.expenses.toArray(),
        db.attachments.toArray(),
        db.settings.toArray(),
      ]);
    return {
      localUser,
      groups,
      people,
      members,
      categories,
      tags,
      expenses,
      attachments,
      settings,
    };
  });

export const restoreFullBackup = async (snapshot: FullBackupSnapshot): Promise<void> => {
  const { data, attachments } = await validateFullBackupSnapshot(snapshot);
  await db.transaction("rw", backupTables, async () => {
    for (const table of backupTables) await table.clear();
    await db.localUser.bulkAdd(data.localUser);
    if (data.groups.length) await db.groups.bulkAdd(data.groups);
    if (data.people.length) await db.people.bulkAdd(data.people);
    if (data.members.length) await db.members.bulkAdd(data.members);
    if (data.categories.length) await db.categories.bulkAdd(data.categories);
    if (data.tags.length) await db.tags.bulkAdd(data.tags);
    if (data.expenses.length) await db.expenses.bulkAdd(data.expenses);
    if (attachments.length) await db.attachments.bulkAdd(attachments);
    await db.settings.bulkAdd(data.settings);

    const counts = await Promise.all(backupTables.map((table) => table.count()));
    const expected = [
      data.localUser.length,
      data.groups.length,
      data.people.length,
      data.members.length,
      data.categories.length,
      data.tags.length,
      data.expenses.length,
      attachments.length,
      data.settings.length,
    ];
    if (counts.some((count, index) => count !== expected[index])) {
      throw new Error("Restored data could not be verified");
    }
  });
};
