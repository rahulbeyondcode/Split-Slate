import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import {
  findPersonConflicts,
  PersonConflictsError,
  planPersonImport,
} from "@/features/import-export/utils/person-conflicts";

import {
  createExportSource,
  GROUP_ONLY_SELECTION,
} from "@/features/import-export/tests/fixtures/transfer-fixture";

const selection = { ...GROUP_ONLY_SELECTION, members: true };

describe("person import conflicts", () => {
  it("exempts the claimed self despite a different local ID", async () => {
    const source = createExportSource();
    source.people[0].name = "Abhi";
    const { bundle } = await buildGroupTransfer(source, selection);
    const self = { id: "local-abhi", name: "Abhi", icon: "🦊" };
    expect(findPersonConflicts(bundle, [self], source.people[0].id)).toEqual([]);
    const plan = planPersonImport(bundle, [self], self.id, source.people[0].id);
    expect(plan.ids.get(source.people[0].id)).toBe(self.id);
  });

  it("requires an explicit choice when distinct source IDs share a name", async () => {
    const source = createExportSource();
    source.people[1].name = "Meenu";
    const { bundle } = await buildGroupTransfer(source, selection);
    const existing = { id: "local-meenu", name: "Meenu", icon: "🐻" };
    const conflicts = findPersonConflicts(bundle, [existing]);
    expect(conflicts).toMatchObject([
      { incoming: { name: "Meenu" }, existing: [{ id: "local-meenu" }] },
    ]);
    expect(() => planPersonImport(bundle, [existing], "self", undefined)).toThrow(
      PersonConflictsError,
    );
    expect(
      planPersonImport(bundle, [existing], "self", undefined, [
        { sourcePersonId: source.people[1].id, type: "reuse", destinationPersonId: existing.id },
      ]).ids.get(source.people[1].id),
    ).toBe(existing.id);
    expect(
      planPersonImport(bundle, [existing], "self", undefined, [
        { sourcePersonId: source.people[1].id, type: "separate", name: "Meenu (trip 2)" },
      ]).additions.find((person) => person.name === "Meenu (trip 2)"),
    ).toBeDefined();
  });

  it("allows renaming the existing contact instead, but rejects duplicate final names", async () => {
    const source = createExportSource();
    source.people[1].name = "Meenu";
    const { bundle } = await buildGroupTransfer(source, selection);
    const existing = { id: "local-meenu", name: "Meenu", icon: "🐻" };
    const resolutions = [
      { sourcePersonId: source.people[1].id, type: "separate" as const, name: "Meenu" },
    ];
    expect(() => planPersonImport(bundle, [existing], "self", undefined, resolutions)).toThrow(
      "Two different contacts",
    );
    expect(() =>
      planPersonImport(bundle, [existing], "self", undefined, [
        { ...resolutions[0], name: "  mEeNu  " },
      ]),
    ).toThrow("Two different contacts");
    expect(
      planPersonImport(bundle, [existing], "self", undefined, resolutions, [
        { personId: existing.id, name: "Meenu (first trip)" },
      ]).renames,
    ).toEqual([{ personId: existing.id, name: "Meenu (first trip)" }]);
  });
});
