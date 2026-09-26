import type { z } from "zod";

import type { portableGroupSchema } from "@/features/import-export/utils/portable-group-schema";

import type {
  Attachment,
  Category,
  Expense,
  Group,
  Member,
  Person,
  Tag,
} from "@/shared/types/domain.types";

export type PortableGroup = z.infer<typeof portableGroupSchema>;
export type PortableAttachment = PortableGroup["attachments"][number];
export type TransferSelection = PortableGroup["manifest"]["selection"];
export type TransferCounts = PortableGroup["manifest"]["includedCounts"];
export type ExportRecordType =
  | "manifest"
  | "group"
  | "person"
  | "member"
  | "category"
  | "tag"
  | "expense"
  | "attachment";

export interface GroupExportSource {
  group: Group;
  people: Person[];
  members: Member[];
  categories: Category[];
  tags: Tag[];
  expenses: Expense[];
  attachmentFiles: Attachment[];
}

export interface GroupTransferSource {
  bundle: PortableGroup;
  attachmentFiles: Attachment[];
}

export type ImportIdentity =
  | { type: "member"; memberId: string }
  | { type: "new"; name?: string; icon?: string };

export interface ImportGroupInput {
  source: GroupTransferSource;
  identity: ImportIdentity;
}

export interface ImportGroupResult {
  group: Group;
  counts: TransferCounts;
}
