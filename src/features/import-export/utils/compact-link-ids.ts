import { sealPortableGroup } from "@/features/import-export/utils/transfer-integrity";

import type { PortableGroup } from "@/features/import-export/types/import-export.types";

// Link IDs only connect records inside the snapshot. Person IDs retain their directory identity.
export const compactLinkIds = async (bundle: PortableGroup): Promise<PortableGroup> => {
  let nextId = 1;
  const assign = (ids: string[]) => new Map(ids.map((id) => [id, String(nextId++)] as const));
  const groupId = String(nextId++);
  const memberIds = assign(bundle.members.map((member) => member.id));
  const categoryIds = assign(bundle.categories.map((category) => category.id));
  const tagIds = assign(bundle.tags.map((tag) => tag.id));
  const expenseIds = assign(bundle.expenses.map((expense) => expense.expenseId));
  const settlementIds = assign(bundle.settlements.map((settlement) => settlement.id));
  const attachmentIds = assign(bundle.attachments.map((attachment) => attachment.id));
  const { integrity, ...manifest } = bundle.manifest;
  void integrity;

  return sealPortableGroup({
    ...bundle,
    manifest,
    group: {
      ...bundle.group,
      id: groupId,
      frequentPayerIds: bundle.group.frequentPayerIds.map((id) => memberIds.get(id)!),
    },
    members: bundle.members.map((member) => ({
      ...member,
      id: memberIds.get(member.id)!,
      groupId,
    })),
    categories: bundle.categories.map((category) => ({
      ...category,
      id: categoryIds.get(category.id)!,
      groupId,
    })),
    tags: bundle.tags.map((tag) => ({ ...tag, id: tagIds.get(tag.id)!, groupId })),
    expenses: bundle.expenses.map((expense) => ({
      ...expense,
      expenseId: expenseIds.get(expense.expenseId)!,
      groupId,
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
      attachmentIds: expense.attachmentIds.map((id) => attachmentIds.get(id)!),
    })),
    settlements: bundle.settlements.map((settlement) => ({
      ...settlement,
      id: settlementIds.get(settlement.id)!,
      groupId,
      fromMemberId: memberIds.get(settlement.fromMemberId)!,
      toMemberId: memberIds.get(settlement.toMemberId)!,
      recordedBy: memberIds.get(settlement.recordedBy)!,
      tagIds: settlement.tagIds.map((id) => tagIds.get(id)!),
    })),
    attachments: bundle.attachments.map((attachment) => ({
      ...attachment,
      id: attachmentIds.get(attachment.id)!,
      expenseId: expenseIds.get(attachment.expenseId)!,
    })),
  });
};
