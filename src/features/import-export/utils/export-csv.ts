import { verifyPortableGroup } from "@/features/import-export/utils/transfer-integrity";

import {
  EXPORT_CSV_COLUMNS,
  EXPORT_SCHEMA_VERSION,
} from "@/features/import-export/constants/export.constants";
import type {
  ExportRecordType,
  PortableGroup,
} from "@/features/import-export/types/import-export.types";

type CsvColumn = (typeof EXPORT_CSV_COLUMNS)[number];
type CsvRow = Record<CsvColumn, string>;

const emptyRow = (): CsvRow =>
  Object.fromEntries(EXPORT_CSV_COLUMNS.map((column) => [column, ""])) as CsvRow;

const makeRow = (recordType: ExportRecordType, values: Partial<CsvRow>): CsvRow => ({
  ...emptyRow(),
  schemaVersion: String(EXPORT_SCHEMA_VERSION),
  recordType,
  ...values,
});

const json = (value: unknown): string => JSON.stringify(value);
const byId = <T extends { id: string }>(left: T, right: T) => left.id.localeCompare(right.id);

const bundleRows = (bundle: PortableGroup): CsvRow[] => [
  makeRow("manifest", {
    selection: json(bundle.manifest.selection),
    sourceCounts: json(bundle.manifest.sourceCounts),
    includedCounts: json(bundle.manifest.includedCounts),
    integrityAlgorithm: bundle.manifest.integrity.algorithm,
    integrityDigest: bundle.manifest.integrity.digest,
  }),
  makeRow("group", {
    id: bundle.group.id,
    name: bundle.group.name,
    icon: bundle.group.icon,
    currency: bundle.group.currency,
    createdAt: String(bundle.group.createdAt),
    frequentPayerIds: json(bundle.group.frequentPayerIds),
  }),
  ...bundle.people
    .slice()
    .sort(byId)
    .map((person) => makeRow("person", { id: person.id, name: person.name, icon: person.icon })),
  ...bundle.members
    .slice()
    .sort(byId)
    .map((member) =>
      makeRow("member", { id: member.id, groupId: member.groupId, personId: member.personId }),
    ),
  ...bundle.categories
    .slice()
    .sort(byId)
    .map((category) =>
      makeRow("category", {
        id: category.id,
        groupId: category.groupId,
        name: category.name,
        icon: category.icon,
        isActive: String(category.isActive),
      }),
    ),
  ...bundle.tags
    .slice()
    .sort(byId)
    .map((tag) =>
      makeRow("tag", {
        id: tag.id,
        groupId: tag.groupId,
        name: tag.name,
        color: tag.color,
      }),
    ),
  ...bundle.expenses
    .slice()
    .sort((left, right) => left.expenseId.localeCompare(right.expenseId))
    .map((expense) =>
      makeRow("expense", {
        id: expense.expenseId,
        groupId: expense.groupId,
        expenseName: expense.expenseName,
        createdBy: expense.createdBy,
        categoryId: expense.categoryId,
        createdAt: String(expense.createdAt),
        when: String(expense.when),
        splitType: expense.splitType,
        splitMeta: json(expense.splitMeta),
        paid: json(expense.transactions.paid),
        owes: json(expense.transactions.owes),
        tagIds: json(expense.tagIds),
        attachmentIds: json(expense.attachmentIds),
      }),
    ),
  ...bundle.attachments
    .slice()
    .sort(byId)
    .map((attachment) =>
      makeRow("attachment", {
        id: attachment.id,
        expenseId: attachment.expenseId,
        mimeType: attachment.mimeType,
        createdAt: String(attachment.createdAt),
      }),
    ),
];

const spreadsheetSafe = (value: string): string => (/^[=+\-@]/u.test(value) ? `\t${value}` : value);
const escapeCsvCell = (value: string): string => `"${spreadsheetSafe(value).replace(/"/g, '""')}"`;

export const createPortableGroupCsv = async (bundle: PortableGroup): Promise<string> => {
  const validated = await verifyPortableGroup(bundle);
  const header = EXPORT_CSV_COLUMNS.map(escapeCsvCell).join(",");
  const lines = bundleRows(validated).map((row) =>
    EXPORT_CSV_COLUMNS.map((key) => escapeCsvCell(row[key])).join(","),
  );
  return `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
};

const parseCsvRows = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") cell += character;
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted value");
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};

const restoreSpreadsheetValue = (value: string): string =>
  /^\t[=+\-@]/u.test(value) ? value.slice(1) : value;

const parseJson = (value: string, field: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`CSV ${field} contains invalid JSON`);
  }
};

const parseInteger = (value: string, field: string, signed = false): number => {
  if (!(signed ? /^-?\d+$/u : /^\d+$/u).test(value)) {
    throw new Error(`CSV ${field} must be ${signed ? "an integer" : "a non-negative integer"}`);
  }
  return Number(value);
};

export const parsePortableGroupCsv = async (csv: string): Promise<PortableGroup> => {
  const rows = parseCsvRows(csv.replace(/^\uFEFF/u, ""));
  const header = rows.shift();
  if (!header || header.join("\u0000") !== EXPORT_CSV_COLUMNS.join("\u0000")) {
    throw new Error("CSV header is not a supported Split Slate transfer");
  }
  const records = rows
    .filter((row) => row.some(Boolean))
    .map((values, rowIndex) => {
      if (values.length !== EXPORT_CSV_COLUMNS.length) {
        throw new Error(`CSV row ${rowIndex + 2} has the wrong number of columns`);
      }
      return Object.fromEntries(
        EXPORT_CSV_COLUMNS.map((column, index) => [column, restoreSpreadsheetValue(values[index])]),
      ) as CsvRow;
    });
  if (!records.length) throw new Error("CSV contains no records");
  if (records.some((row) => row.schemaVersion !== String(EXPORT_SCHEMA_VERSION))) {
    throw new Error("CSV schema version is not supported");
  }

  const allowedTypes: ExportRecordType[] = [
    "manifest",
    "group",
    "person",
    "member",
    "category",
    "tag",
    "expense",
    "attachment",
  ];
  if (records.some((row) => !allowedTypes.includes(row.recordType as ExportRecordType))) {
    throw new Error("CSV contains an unknown record type");
  }
  const ofType = (recordType: ExportRecordType) =>
    records.filter((row) => row.recordType === recordType);
  const manifests = ofType("manifest");
  const groups = ofType("group");
  if (manifests.length !== 1) throw new Error("CSV must contain exactly one manifest record");
  if (groups.length !== 1) throw new Error("CSV must contain exactly one group record");
  const manifest = manifests[0];
  const group = groups[0];

  return verifyPortableGroup({
    schemaVersion: EXPORT_SCHEMA_VERSION,
    manifest: {
      selection: parseJson(manifest.selection, "selection"),
      sourceCounts: parseJson(manifest.sourceCounts, "sourceCounts"),
      includedCounts: parseJson(manifest.includedCounts, "includedCounts"),
      integrity: {
        algorithm: manifest.integrityAlgorithm,
        digest: manifest.integrityDigest,
      },
    },
    group: {
      id: group.id,
      name: group.name,
      icon: group.icon,
      currency: group.currency,
      createdAt: parseInteger(group.createdAt, "group createdAt"),
      frequentPayerIds: parseJson(group.frequentPayerIds, "frequentPayerIds"),
    },
    people: ofType("person").map((row) => ({ id: row.id, name: row.name, icon: row.icon })),
    members: ofType("member").map((row) => ({
      id: row.id,
      groupId: row.groupId,
      personId: row.personId,
    })),
    categories: ofType("category").map((row) => ({
      id: row.id,
      groupId: row.groupId,
      name: row.name,
      icon: row.icon,
      isActive: row.isActive === "true" ? true : row.isActive === "false" ? false : row.isActive,
    })),
    tags: ofType("tag").map((row) => ({
      id: row.id,
      groupId: row.groupId,
      name: row.name,
      color: row.color,
    })),
    expenses: ofType("expense").map((row) => ({
      expenseId: row.id,
      groupId: row.groupId,
      expenseName: row.expenseName,
      createdBy: row.createdBy,
      categoryId: row.categoryId,
      createdAt: parseInteger(row.createdAt, "expense createdAt"),
      when: parseInteger(row.when, "expense when", true),
      splitType: row.splitType,
      splitMeta: parseJson(row.splitMeta, "splitMeta"),
      transactions: {
        paid: parseJson(row.paid, "paid"),
        owes: parseJson(row.owes, "owes"),
      },
      tagIds: parseJson(row.tagIds, "tagIds"),
      attachmentIds: parseJson(row.attachmentIds, "attachmentIds"),
    })),
    attachments: ofType("attachment").map((row) => ({
      id: row.id,
      expenseId: row.expenseId,
      mimeType: row.mimeType,
      createdAt: parseInteger(row.createdAt, "attachment createdAt"),
    })),
  });
};
