import { v4 as uuid } from "uuid";

import type {
  ExistingPersonRename,
  PersonResolution,
  PortableGroup,
} from "@/features/import-export/types/import-export.types";
import type { Person } from "@/shared/types/domain.types";

export interface PersonConflict {
  incoming: Person;
  existing: Person[];
  arriving: Person[];
}

export class PersonConflictsError extends Error {
  readonly conflicts: PersonConflict[];

  constructor(conflicts: PersonConflict[]) {
    super("Resolve people with the same name before importing");
    this.name = "PersonConflictsError";
    this.conflicts = conflicts;
  }
}

export const personNameKey = (name: string): string => name.trim().toLowerCase();

export const findPersonConflicts = (
  bundle: PortableGroup,
  existingPeople: Person[],
  selectedPersonId?: string,
): PersonConflict[] =>
  bundle.people.flatMap((incoming, index) => {
    if (incoming.id === selectedPersonId) return [];
    const sameId = existingPeople.find((person) => person.id === incoming.id);
    if (
      sameId?.name === incoming.name &&
      sameId.icon === incoming.icon &&
      !existingPeople.some(
        (person) =>
          person.id !== sameId.id && personNameKey(person.name) === personNameKey(incoming.name),
      )
    ) {
      return [];
    }
    const existing = existingPeople.filter(
      (person) => personNameKey(person.name) === personNameKey(incoming.name),
    );
    const arriving = bundle.people
      .slice(0, index)
      .filter(
        (person) =>
          person.id !== selectedPersonId &&
          personNameKey(person.name) === personNameKey(incoming.name),
      );
    return existing.length || arriving.length ? [{ incoming, existing, arriving }] : [];
  });

interface PersonImportPlan {
  ids: Map<string, string>;
  additions: Person[];
  renames: ExistingPersonRename[];
}

export const planPersonImport = (
  bundle: PortableGroup,
  existingPeople: Person[],
  selfId: string,
  selectedPersonId: string | undefined,
  resolutions: PersonResolution[] = [],
  renames: ExistingPersonRename[] = [],
): PersonImportPlan => {
  const conflicts = findPersonConflicts(bundle, existingPeople, selectedPersonId);
  const bySource = new Map(
    resolutions.map((resolution) => [resolution.sourcePersonId, resolution]),
  );
  const renameById = new Map(renames.map((rename) => [rename.personId, rename]));
  if (bySource.size !== resolutions.length || renameById.size !== renames.length) {
    throw new Error("Duplicate person resolution");
  }
  if (conflicts.some((conflict) => !bySource.has(conflict.incoming.id))) {
    throw new PersonConflictsError(conflicts);
  }
  if (
    resolutions.some(
      (resolution) => !conflicts.some((item) => item.incoming.id === resolution.sourcePersonId),
    )
  ) {
    throw new Error("Person resolution no longer matches this import");
  }
  const renameable = new Set(
    conflicts.flatMap((conflict) => conflict.existing.map((person) => person.id)),
  );
  for (const rename of renames) {
    if (!renameable.has(rename.personId) || !rename.name.trim()) {
      throw new Error("Invalid existing contact rename");
    }
  }

  const ids = new Map<string, string>();
  const additions: Person[] = [];
  const occupiedIds = new Set(existingPeople.map((person) => person.id));
  for (const person of bundle.people) {
    if (person.id === selectedPersonId) {
      ids.set(person.id, selfId);
      continue;
    }
    const conflict = conflicts.find((item) => item.incoming.id === person.id);
    const resolution = bySource.get(person.id);
    if (resolution?.type === "reuse") {
      if (
        !conflict?.existing.some((candidate) => candidate.id === resolution.destinationPersonId)
      ) {
        throw new Error("Choose a matching existing contact");
      }
      ids.set(person.id, resolution.destinationPersonId);
      continue;
    }
    const existing = existingPeople.find((candidate) => candidate.id === person.id);
    if (!resolution && existing?.name === person.name && existing.icon === person.icon) {
      ids.set(person.id, existing.id);
      continue;
    }
    const name = resolution?.type === "separate" ? resolution.name.trim() : person.name.trim();
    if (!name) throw new Error("Contact name is required");
    let destinationId = person.id;
    while (occupiedIds.has(destinationId)) destinationId = uuid();
    occupiedIds.add(destinationId);
    ids.set(person.id, destinationId);
    additions.push({ ...person, id: destinationId, name });
  }

  const names = new Map<string, string>();
  for (const person of [...existingPeople, ...additions]) {
    const name = renameById.get(person.id)?.name.trim() ?? person.name;
    const key = personNameKey(name);
    if (names.has(key) && names.get(key) !== person.id) {
      throw new Error(`Two different contacts cannot both be named “${name}”`);
    }
    names.set(key, person.id);
  }
  if (
    new Set(bundle.members.map((member) => ids.get(member.personId))).size !== bundle.members.length
  ) {
    throw new Error("Two members of this group cannot be the same contact");
  }
  return {
    ids,
    additions,
    renames: renames.map((rename) => ({ ...rename, name: rename.name.trim() })),
  };
};
