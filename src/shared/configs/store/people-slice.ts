import { v4 as uuid } from "uuid";

import { db } from "@/shared/configs/db";

import type { LocalUser, Person } from "@/shared/types/domain.types";

import type { PeopleSlice, SliceCreator } from "./types";

export const createPeopleSlice: SliceCreator<PeopleSlice> = (set, get) => ({
  localUser: null,
  people: [],

  setLocalUser: async (name, icon) => {
    const existing = get().localUser;
    const user: LocalUser = { id: existing?.id ?? uuid(), name, icon };
    await db.localUser.put(user);

    const selfPerson: Person = { id: user.id, name, icon };
    await db.people.put(selfPerson);
    set((s) => ({
      localUser: user,
      people: s.people.some((p) => p.id === user.id)
        ? s.people.map((p) => (p.id === user.id ? selfPerson : p))
        : [...s.people, selfPerson],
    }));
    return user;
  },

  addPerson: async (name, icon) => {
    const person: Person = { id: uuid(), name, icon };
    await db.people.add(person);
    set((s) => ({ people: [...s.people, person] }));
    return person;
  },

  updatePerson: async (personId, patch) => {
    await db.people.update(personId, patch);
    const existing = get().people.find((p) => p.id === personId);
    if (!existing) {
      throw new Error("person not found");
    }
    const updated: Person = { ...existing, ...patch };
    set((s) => ({ people: s.people.map((p) => (p.id === personId ? updated : p)) }));
    return updated;
  },

  removePerson: async (personId) => {
    const memberIds = get()
      .members.filter((m) => m.personId === personId)
      .map((m) => m.id);
    const inUse = get().expenses.some(
      (e) =>
        memberIds.includes(e.createdBy) ||
        e.transactions.paid.some((t) => memberIds.includes(t.memberId)) ||
        e.transactions.owes.some((t) => memberIds.includes(t.memberId)),
    );
    if (inUse) {
      throw new Error("Cannot delete a person involved in expenses; reassign those expenses first");
    }

    await db.people.delete(personId);
    await db.members.bulkDelete(memberIds);
    const affectedGroups = get().groups.filter((g) =>
      g.frequentPayerIds.some((id) => memberIds.includes(id)),
    );
    for (const group of affectedGroups) {
      const frequentPayerIds = group.frequentPayerIds.filter((id) => !memberIds.includes(id));
      await db.groups.update(group.id, { frequentPayerIds });
    }

    set((s) => ({
      people: s.people.filter((p) => p.id !== personId),
      members: s.members.filter((m) => m.personId !== personId),
      groups: s.groups.map((g) =>
        g.frequentPayerIds.some((id) => memberIds.includes(id))
          ? { ...g, frequentPayerIds: g.frequentPayerIds.filter((id) => !memberIds.includes(id)) }
          : g,
      ),
    }));
  },
});
