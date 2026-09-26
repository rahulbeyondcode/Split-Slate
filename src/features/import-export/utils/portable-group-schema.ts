import { z } from "zod";

import { EXPORT_SCHEMA_VERSION } from "@/features/import-export/constants/export.constants";
import { CURRENCIES } from "@/shared/constants/currencies";

const idSchema = z.string().trim().min(1);
const timestampSchema = z.number().int().safe().nonnegative();
const amountSchema = z.number().int().safe().nonnegative();
const countSchema = z.number().int().safe().nonnegative();
const currencyCodes = new Set(CURRENCIES.map((currency) => currency.code));

export const transferSelectionSchema = z
  .object({
    categories: z.boolean(),
    tags: z.boolean(),
    members: z.boolean(),
    expenses: z.boolean(),
    attachments: z.boolean(),
  })
  .superRefine((selection, context) => {
    if (selection.expenses && (!selection.categories || !selection.members)) {
      context.addIssue({
        code: "custom",
        message: "Expenses require categories and members",
      });
    }
    if (selection.attachments && !selection.expenses) {
      context.addIssue({ code: "custom", message: "Attachments require expenses" });
    }
  });

const countsSchema = z.object({
  categories: countSchema,
  tags: countSchema,
  members: countSchema,
  expenses: countSchema,
  attachments: countSchema,
});

const manifestSchema = z.object({
  selection: transferSelectionSchema,
  sourceCounts: countsSchema,
  includedCounts: countsSchema,
  integrity: z.object({
    algorithm: z.literal("SHA-256"),
    digest: z.string().regex(/^[0-9a-f]{64}$/u),
  }),
});

const groupSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  currency: z.string().refine((currency) => currencyCodes.has(currency), "Unsupported currency"),
  createdAt: timestampSchema,
  frequentPayerIds: z.array(idSchema),
});

const personSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1),
  icon: z.string().trim().min(1),
});

const memberSchema = z.object({ id: idSchema, groupId: idSchema, personId: idSchema });
const categorySchema = z.object({
  id: idSchema,
  groupId: idSchema,
  name: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  isActive: z.boolean(),
});
const tagSchema = z.object({
  id: idSchema,
  groupId: idSchema,
  name: z.string().trim().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/u),
});
const transactionSchema = z.object({ memberId: idSchema, amount: amountSchema });
const splitMetaSchema = z.object({
  memberId: idSchema,
  value: z.union([z.string().trim().min(1), z.number().finite()]),
});
const expenseSchema = z.object({
  expenseId: idSchema,
  groupId: idSchema,
  expenseName: z.string().trim().min(1),
  createdBy: idSchema,
  categoryId: idSchema,
  createdAt: timestampSchema,
  when: z.number().int().safe(),
  splitType: z.enum(["equal", "amount", "shares", "percentage", "adjustment"]),
  splitMeta: z.array(splitMetaSchema),
  transactions: z.object({
    paid: z.array(transactionSchema).min(1),
    owes: z.array(transactionSchema).min(1),
  }),
  tagIds: z.array(idSchema),
  attachmentIds: z.array(idSchema),
});
const attachmentSchema = z.object({
  id: idSchema,
  expenseId: idSchema,
  mimeType: z.string().trim().min(1),
  createdAt: timestampSchema,
});

const addDuplicateIssues = (
  values: string[],
  path: (string | number)[],
  context: z.RefinementCtx,
) => {
  if (new Set(values).size !== values.length) {
    context.addIssue({ code: "custom", path, message: "IDs must be unique" });
  }
};

const parseRatioText = (value: string): bigint | null => {
  if (!/^\d+(?:\.\d{1,6})?$/u.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const ratio = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
  return ratio > 0n && ratio <= BigInt(Number.MAX_SAFE_INTEGER) ? ratio : null;
};

export const portableGroupSchema = z
  .object({
    schemaVersion: z.literal(EXPORT_SCHEMA_VERSION),
    manifest: manifestSchema,
    group: groupSchema,
    people: z.array(personSchema),
    members: z.array(memberSchema),
    categories: z.array(categorySchema),
    tags: z.array(tagSchema),
    expenses: z.array(expenseSchema),
    attachments: z.array(attachmentSchema),
  })
  .superRefine((data, context) => {
    const { selection, sourceCounts, includedCounts } = data.manifest;
    const actualCounts = {
      categories: data.categories.length,
      tags: data.tags.length,
      members: data.members.length,
      expenses: data.expenses.length,
      attachments: data.attachments.length,
    };

    for (const key of Object.keys(actualCounts) as (keyof typeof actualCounts)[]) {
      if (includedCounts[key] !== actualCounts[key]) {
        context.addIssue({
          code: "custom",
          path: ["manifest", "includedCounts", key],
          message: "Included count does not match the dataset",
        });
      }
      if (sourceCounts[key] < includedCounts[key]) {
        context.addIssue({
          code: "custom",
          path: ["manifest", "sourceCounts", key],
          message: "Source count cannot be smaller than the included count",
        });
      }
      if (!selection[key] && includedCounts[key] !== 0) {
        context.addIssue({
          code: "custom",
          path: ["manifest", "selection", key],
          message: "Unselected content must not be included",
        });
      }
      if (selection[key] && includedCounts[key] !== sourceCounts[key]) {
        context.addIssue({
          code: "custom",
          path: ["manifest", "includedCounts", key],
          message: "Selected content must include the complete source collection",
        });
      }
    }

    const collections = [
      [data.people.map((item) => item.id), "people"],
      [data.members.map((item) => item.id), "members"],
      [data.categories.map((item) => item.id), "categories"],
      [data.tags.map((item) => item.id), "tags"],
      [data.expenses.map((item) => item.expenseId), "expenses"],
      [data.attachments.map((item) => item.id), "attachments"],
    ] as const;
    for (const [ids, name] of collections) addDuplicateIssues(ids, [name], context);

    const people = new Set(data.people.map((item) => item.id));
    const members = new Set(data.members.map((item) => item.id));
    const categories = new Set(data.categories.map((item) => item.id));
    const tags = new Set(data.tags.map((item) => item.id));
    const expenses = new Map(data.expenses.map((item) => [item.expenseId, item]));
    const attachments = new Map(data.attachments.map((item) => [item.id, item]));

    addDuplicateIssues(data.group.frequentPayerIds, ["group", "frequentPayerIds"], context);
    if (data.group.frequentPayerIds.some((id) => !members.has(id))) {
      context.addIssue({
        code: "custom",
        path: ["group", "frequentPayerIds"],
        message: "Frequent payer member is missing",
      });
    }

    data.members.forEach((member, index) => {
      if (member.groupId !== data.group.id) {
        context.addIssue({
          code: "custom",
          path: ["members", index, "groupId"],
          message: "Member belongs to another group",
        });
      }
      if (!people.has(member.personId)) {
        context.addIssue({
          code: "custom",
          path: ["members", index, "personId"],
          message: "Member person is missing",
        });
      }
    });
    const referencedPeople = new Set(data.members.map((member) => member.personId));
    if (data.people.some((person) => !referencedPeople.has(person.id))) {
      context.addIssue({ code: "custom", path: ["people"], message: "Person is not a member" });
    }

    for (const collection of ["categories", "tags"] as const) {
      data[collection].forEach((record, index) => {
        if (record.groupId !== data.group.id) {
          context.addIssue({
            code: "custom",
            path: [collection, index, "groupId"],
            message: "Record belongs to another group",
          });
        }
      });
    }

    data.expenses.forEach((expense, index) => {
      if (expense.groupId !== data.group.id) {
        context.addIssue({
          code: "custom",
          path: ["expenses", index, "groupId"],
          message: "Expense belongs to another group",
        });
      }
      if (!members.has(expense.createdBy)) {
        context.addIssue({
          code: "custom",
          path: ["expenses", index, "createdBy"],
          message: "Expense creator is missing",
        });
      }
      if (!categories.has(expense.categoryId)) {
        context.addIssue({
          code: "custom",
          path: ["expenses", index, "categoryId"],
          message: "Expense category is missing",
        });
      }
      expense.tagIds.forEach((id, tagIndex) => {
        if (!tags.has(id)) {
          context.addIssue({
            code: "custom",
            path: ["expenses", index, "tagIds", tagIndex],
            message: "Expense tag is missing",
          });
        }
      });
      addDuplicateIssues(expense.tagIds, ["expenses", index, "tagIds"], context);
      addDuplicateIssues(expense.attachmentIds, ["expenses", index, "attachmentIds"], context);
      addDuplicateIssues(
        expense.transactions.paid.map((row) => row.memberId),
        ["expenses", index, "transactions", "paid"],
        context,
      );
      addDuplicateIssues(
        expense.transactions.owes.map((row) => row.memberId),
        ["expenses", index, "transactions", "owes"],
        context,
      );
      addDuplicateIssues(
        expense.splitMeta.map((row) => row.memberId),
        ["expenses", index, "splitMeta"],
        context,
      );

      const transactionRows = [
        ...expense.transactions.paid.map((row) => [row, "paid"] as const),
        ...expense.transactions.owes.map((row) => [row, "owes"] as const),
      ];
      for (const [row, side] of transactionRows) {
        if (!members.has(row.memberId)) {
          context.addIssue({
            code: "custom",
            path: ["expenses", index, "transactions", side],
            message: "Transaction member is missing",
          });
        }
      }

      expense.splitMeta.forEach((row, metaIndex) => {
        if (!members.has(row.memberId)) {
          context.addIssue({
            code: "custom",
            path: ["expenses", index, "splitMeta", metaIndex, "memberId"],
            message: "Split member is missing",
          });
        }
      });
      const owedIds = expense.transactions.owes.map((row) => row.memberId);
      const metaIds = expense.splitMeta.map((row) => row.memberId);
      if (expense.splitType === "equal" || expense.splitType === "amount") {
        if (expense.splitMeta.length) {
          context.addIssue({
            code: "custom",
            path: ["expenses", index, "splitMeta"],
            message: "This split type must not contain split metadata",
          });
        }
      } else if (metaIds.length !== owedIds.length || metaIds.some((id) => !owedIds.includes(id))) {
        context.addIssue({
          code: "custom",
          path: ["expenses", index, "splitMeta"],
          message: "Split metadata must match owed members",
        });
      } else if (expense.splitType === "adjustment") {
        if (
          expense.splitMeta.some(
            (row) => typeof row.value !== "number" || !Number.isSafeInteger(row.value),
          )
        ) {
          context.addIssue({
            code: "custom",
            path: ["expenses", index, "splitMeta"],
            message: "Adjustments must be safe integer minor-unit amounts",
          });
        }
      } else {
        const invalidRatio = expense.splitMeta.some((row) =>
          typeof row.value === "string"
            ? parseRatioText(row.value) === null
            : row.value <= 0 || row.value > Number.MAX_SAFE_INTEGER,
        );
        if (invalidRatio) {
          context.addIssue({
            code: "custom",
            path: ["expenses", index, "splitMeta"],
            message: "Shares and percentages must contain positive valid ratios",
          });
        }
        if (
          expense.splitType === "percentage" &&
          expense.splitMeta.every((row) => typeof row.value === "string")
        ) {
          const total = expense.splitMeta.reduce(
            (sum, row) => sum + (parseRatioText(String(row.value)) ?? 0n),
            0n,
          );
          if (total !== 100_000_000n) {
            context.addIssue({
              code: "custom",
              path: ["expenses", index, "splitMeta"],
              message: "Percentage metadata must add up to 100%",
            });
          }
        }
      }

      const paid = expense.transactions.paid.reduce((sum, row) => sum + BigInt(row.amount), 0n);
      const owed = expense.transactions.owes.reduce((sum, row) => sum + BigInt(row.amount), 0n);
      if (expense.transactions.paid.some((row) => row.amount <= 0) || paid <= 0n || paid !== owed) {
        context.addIssue({
          code: "custom",
          path: ["expenses", index, "transactions"],
          message: "Paid and owed totals must match and be positive",
        });
      }

      expense.attachmentIds.forEach((id, attachmentIndex) => {
        const attachment = attachments.get(id);
        if (!attachment || attachment.expenseId !== expense.expenseId) {
          context.addIssue({
            code: "custom",
            path: ["expenses", index, "attachmentIds", attachmentIndex],
            message: "Expense attachment is missing",
          });
        }
      });
    });

    data.attachments.forEach((attachment, index) => {
      const expense = expenses.get(attachment.expenseId);
      if (!expense || !expense.attachmentIds.includes(attachment.id)) {
        context.addIssue({
          code: "custom",
          path: ["attachments", index],
          message: "Attachment expense reference is missing",
        });
      }
    });

    const groupTotal = data.expenses.reduce(
      (total, expense) =>
        total +
        expense.transactions.paid.reduce(
          (sum, transaction) => sum + BigInt(transaction.amount),
          0n,
        ),
      0n,
    );
    if (groupTotal > BigInt(Number.MAX_SAFE_INTEGER)) {
      context.addIssue({
        code: "custom",
        path: ["expenses"],
        message: "Group spending exceeds the supported safe-integer limit",
      });
    }
  });
