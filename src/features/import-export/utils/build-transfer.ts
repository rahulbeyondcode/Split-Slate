import { sealPortableGroup } from "@/features/import-export/utils/transfer-integrity";

import { EXPORT_SCHEMA_VERSION } from "@/features/import-export/constants/export.constants";
import type {
  GroupExportSource,
  GroupTransferSource,
  TransferCounts,
  TransferSelection,
} from "@/features/import-export/types/import-export.types";

const byId = <T extends { id: string }>(left: T, right: T) => left.id.localeCompare(right.id);

export const resolveTransferSelection = (selection: TransferSelection): TransferSelection => ({
  ...selection,
  expenses: selection.expenses || selection.attachments,
  categories: selection.categories || selection.expenses || selection.attachments,
  members: selection.members || selection.expenses || selection.attachments,
});

export const buildGroupTransfer = async (
  source: GroupExportSource,
  requestedSelection: TransferSelection,
): Promise<GroupTransferSource> => {
  const selection = resolveTransferSelection(requestedSelection);
  const members = selection.members ? source.members.slice().sort(byId) : [];
  const memberIds = new Set(members.map((member) => member.id));
  const personIds = new Set(members.map((member) => member.personId));
  const categories = selection.categories ? source.categories.slice().sort(byId) : [];
  const tags = selection.tags ? source.tags.slice().sort(byId) : [];
  const expenses = selection.expenses
    ? source.expenses
        .slice()
        .sort((left, right) => left.expenseId.localeCompare(right.expenseId))
        .map((expense) => ({
          ...expense,
          tagIds: selection.tags ? expense.tagIds : [],
          attachmentIds: selection.attachments ? expense.attachmentIds : [],
        }))
    : [];
  const expenseIds = new Set(expenses.map((expense) => expense.expenseId));
  const attachmentFiles = selection.attachments
    ? source.attachmentFiles
        .filter((attachment) => expenseIds.has(attachment.expenseId))
        .slice()
        .sort(byId)
    : [];
  const attachments = attachmentFiles.map(({ id, expenseId, mimeType, createdAt }) => ({
    id,
    expenseId,
    mimeType,
    createdAt,
  }));
  const people = source.people
    .filter((person) => personIds.has(person.id))
    .slice()
    .sort(byId);
  const sourceCounts: TransferCounts = {
    categories: source.categories.length,
    tags: source.tags.length,
    members: source.members.length,
    expenses: source.expenses.length,
    attachments: source.attachmentFiles.length,
  };
  const includedCounts: TransferCounts = {
    categories: categories.length,
    tags: tags.length,
    members: members.length,
    expenses: expenses.length,
    attachments: attachments.length,
  };

  const bundle = await sealPortableGroup({
    schemaVersion: EXPORT_SCHEMA_VERSION,
    manifest: { selection, sourceCounts, includedCounts },
    group: {
      ...source.group,
      frequentPayerIds: source.group.frequentPayerIds.filter((id) => memberIds.has(id)),
    },
    people,
    members,
    categories,
    tags,
    expenses,
    attachments,
  });

  return { bundle, attachmentFiles };
};
