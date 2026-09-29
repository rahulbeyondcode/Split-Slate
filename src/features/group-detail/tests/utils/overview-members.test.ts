import { describe, expect, it } from "vitest";

import { overviewMembers } from "@/features/group-detail/utils/overview-members";

import type { GroupMemberWithPerson } from "@/features/group-detail/types/group-detail.types";
import type { Expense } from "@/shared/types/domain.types";

const members: GroupMemberWithPerson[] = [
  { id: "a", groupId: "trip", personId: "a", person: { id: "a", name: "Amy", icon: "🦊" } },
  { id: "b", groupId: "trip", personId: "b", person: { id: "b", name: "Bea", icon: "🐻" } },
  { id: "c", groupId: "trip", personId: "c", person: { id: "c", name: "Cal", icon: "🐱" } },
  { id: "d", groupId: "trip", personId: "d", person: { id: "d", name: "Dee", icon: "🐶" } },
  { id: "e", groupId: "trip", personId: "e", person: { id: "e", name: "Eli", icon: "🐸" } },
  { id: "f", groupId: "trip", personId: "f", person: { id: "f", name: "Flo", icon: "🦋" } },
  { id: "g", groupId: "trip", personId: "g", person: { id: "g", name: "Gia", icon: "🐼" } },
];

const expense = (id: string, paid: Expense["transactions"]["paid"]): Expense => ({
  expenseId: id,
  groupId: "trip",
  expenseName: id,
  categoryId: "food",
  createdBy: "a",
  createdAt: 1,
  when: 1,
  splitType: "equal",
  splitMeta: [],
  tagIds: [],
  attachmentIds: [],
  transactions: { paid, owes: [{ memberId: "a", amount: 100 }] },
});

const ids = (result: GroupMemberWithPerson[]) => result.map((member) => member.id);

describe("overview member preview", () => {
  it("shows up to six members alphabetically when nobody has paid", () => {
    expect(ids(overviewMembers(members.slice().reverse(), []))).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
    expect(ids(overviewMembers(members.slice(0, 2), []))).toEqual(["a", "b"]);
  });

  it("ranks by number of expenses paid, not amount, then fills alphabetically", () => {
    const expenses = [
      expense("large", [{ memberId: "g", amount: 100000 }]),
      expense("small-1", [{ memberId: "c", amount: 100 }]),
      expense("small-2", [{ memberId: "c", amount: 100 }]),
    ];
    expect(ids(overviewMembers(members, expenses))).toEqual(["c", "g", "a", "b", "d", "e"]);
  });

  it("counts a shared expense once per positive payer and breaks ties by name", () => {
    const expenses = [
      expense("shared", [
        { memberId: "c", amount: 50 },
        { memberId: "b", amount: 50 },
        { memberId: "b", amount: 10 },
        { memberId: "d", amount: 0 },
        { memberId: "unknown", amount: 10 },
      ]),
    ];
    expect(ids(overviewMembers(members, expenses))).toEqual(["b", "c", "a", "d", "e", "f"]);
  });
});
