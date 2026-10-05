import type { z } from "zod";

import type { portableGroupSchema } from "@/features/import-export/utils/portable-group-schema";

import type {
  Attachment,
  Category,
  Expense,
  Group,
  Member,
  Person,
  Settlement,
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
  | "settlement"
  | "attachment";

export interface GroupExportSource {
  group: Group;
  people: Person[];
  members: Member[];
  categories: Category[];
  tags: Tag[];
  expenses: Expense[];
  settlements: Settlement[];
  attachmentFiles: Attachment[];
}

export interface GroupTransferSource {
  bundle: PortableGroup;
  attachmentFiles: Attachment[];
}

export type ImportIdentity =
  | { type: "member"; memberId: string }
  | { type: "new"; name?: string; icon?: string };

export type PersonResolution =
  | { sourcePersonId: string; type: "reuse"; destinationPersonId: string }
  | { sourcePersonId: string; type: "separate"; name: string };

export interface ExistingPersonRename {
  personId: string;
  name: string;
}

export interface ImportGroupInput {
  source: GroupTransferSource;
  identity: ImportIdentity;
  personResolutions?: PersonResolution[];
  existingPersonRenames?: ExistingPersonRename[];
}

export interface ImportGroupResult {
  group: Group;
  counts: TransferCounts;
}
