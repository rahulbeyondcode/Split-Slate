import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";

import type {
  GroupExportSource,
  TransferSelection,
} from "@/features/import-export/types/import-export.types";

interface FixtureOptions {
  memberCount?: number;
  categoryCount?: number;
  tagCount?: number;
  expenseCount?: number;
  withAttachments?: boolean;
}

const id = (type: string, index: number): string =>
  `${type}-${String(index + 1).padStart(4, "0")}-12345678-90ab-cdef`;

export const COMPLETE_SELECTION: TransferSelection = {
  categories: true,
  tags: true,
  members: true,
  expenses: true,
  attachments: true,
};

export const GROUP_ONLY_SELECTION: TransferSelection = {
  categories: false,
  tags: false,
  members: false,
  expenses: false,
  attachments: false,
};

export const createExportSource = ({
  memberCount = 2,
  categoryCount = 2,
  tagCount = 2,
  expenseCount = 1,
  withAttachments = false,
}: FixtureOptions = {}): GroupExportSource => {
  const groupId = "group-0001-12345678-90ab-cdef";
  const people = Array.from({ length: memberCount }, (_, index) => ({
    id: id("person", index),
    name: `Person ${index + 1}`,
    icon: ["🦊", "🐻", "🐼", "🦁"][index % 4],
  }));
  const members = people.map((person, index) => ({
    id: id("member", index),
    groupId,
    personId: person.id,
  }));
  const categories = Array.from({ length: categoryCount }, (_, index) => ({
    id: id("category", index),
    groupId,
    name: `Category ${index + 1}`,
    icon: "🍽️",
    isActive: true,
  }));
  const tags = Array.from({ length: tagCount }, (_, index) => ({
    id: id("tag", index),
    groupId,
    name: `Tag ${index + 1}`,
    color: `#${((index + 1) * 7919).toString(16).padStart(6, "0").slice(-6)}`,
  }));
  const expenses = Array.from({ length: expenseCount }, (_, index) => {
    const owingMembers = members.slice(0, Math.min(5, members.length));
    const total = 10_000 + index;
    const base = Math.floor(total / owingMembers.length);
    let remainder = total - base * owingMembers.length;
    return {
      expenseId: id("expense", index),
      groupId,
      expenseName: `Expense ${index + 1}`,
      createdBy: members[index % members.length].id,
      categoryId: categories[index % categories.length].id,
      createdAt: 1_700_000_000_000 + index,
      when: 1_700_000_000_000 + index * 86_400_000,
      splitType: "equal" as const,
      splitMeta: [],
      transactions: {
        paid: [{ memberId: members[index % members.length].id, amount: total }],
        owes: owingMembers.map((member) => ({
          memberId: member.id,
          amount: base + (remainder-- > 0 ? 1 : 0),
        })),
      },
      tagIds: tags.slice(0, Math.min(3, tags.length)).map((tag) => tag.id),
      attachmentIds: withAttachments ? [id("attachment", index)] : [],
    };
  });
  const attachmentFiles = withAttachments
    ? expenses.map((expense, index) => ({
        id: id("attachment", index),
        expenseId: expense.expenseId,
        blob: new Blob([`receipt ${index + 1}`], { type: "image/jpeg" }),
        mimeType: "image/jpeg",
        createdAt: 1_700_000_100_000 + index,
      }))
    : [];

  return {
    group: {
      id: groupId,
      name: "Weekend Trip",
      icon: "🏕️",
      currency: "INR",
      createdAt: 1_700_000_000_000,
      frequentPayerIds: members.slice(0, Math.min(5, members.length)).map((member) => member.id),
    },
    people,
    members,
    categories,
    tags,
    expenses,
    attachmentFiles,
  };
};

export const createTransfer = (
  selection: TransferSelection = { ...COMPLETE_SELECTION, attachments: false },
  options?: FixtureOptions,
) => buildGroupTransfer(createExportSource(options), selection);
