import { v4 as uuid } from "uuid";

import { writeActivity } from "@/features/activity/utils/activity-events";
import { db } from "@/shared/configs/db";
import { normalizeRequiredString } from "@/shared/utils/string-validation";

import type { LocalUser, Person } from "@/shared/types/domain.types";

import type { PeopleSlice, SliceCreator } from "./types";

export const createPeopleSlice: SliceCreator<PeopleSlice> = (set, get) => ({
  localUser: null,
  people: [],

  setLocalUser: async (name, icon) => {
    const existing = get().localUser;
    const normalizedName = normalizeRequiredString(name, "Name is required");
    const normalizedIcon = normalizeRequiredString(icon, "Icon is required");
    const user: LocalUser = {
      id: existing?.id ?? uuid(),
      name: normalizedName,
      icon: normalizedIcon,
    };
    const selfPerson: Person = { id: user.id, name: normalizedName, icon: normalizedIcon };
    const event = await db.transaction(
      "rw",
      db.localUser,
      db.people,
      db.activityEvents,
      async () => {
        await db.localUser.put(user);
        await db.people.put(selfPerson);
        return writeActivity({
          kind: "person",
          action: existing ? "updated" : "created",
          label: user.name,
          icon: user.icon,
          subjectId: user.id,
        });
      },
    );
    set((s) => ({
      activityEvents: [...s.activityEvents, event],
      localUser: user,
      people: s.people.some((p) => p.id === user.id)
        ? s.people.map((p) => (p.id === user.id ? selfPerson : p))
        : [...s.people, selfPerson],
    }));
    return user;
  },

  addPerson: async (name, icon) => {
    const person: Person = {
      id: uuid(),
      name: normalizeRequiredString(name, "Name is required"),
      icon: normalizeRequiredString(icon, "Icon is required"),
    };
    const event = await db.transaction("rw", db.people, db.activityEvents, async () => {
      await db.people.add(person);
      return writeActivity({
        kind: "person",
        action: "created",
        label: person.name,
        icon: person.icon,
        subjectId: person.id,
      });
    });
    set((s) => ({ people: [...s.people, person], activityEvents: [...s.activityEvents, event] }));
    return person;
  },

  updatePerson: async (personId, patch) => {
    const normalizedPatch: Partial<Omit<Person, "id">> = {
      ...patch,
      ...(patch.name !== undefined
        ? { name: normalizeRequiredString(patch.name, "Name is required") }
        : {}),
      ...(patch.icon !== undefined
        ? { icon: normalizeRequiredString(patch.icon, "Icon is required") }
        : {}),
    };
    const existing = get().people.find((p) => p.id === personId);
    if (!existing) {
      throw new Error("person not found");
    }
    const updated: Person = { ...existing, ...normalizedPatch };
    const event = await db.transaction("rw", db.people, db.activityEvents, async () => {
      if (!(await db.people.update(personId, normalizedPatch))) throw new Error("Person not found");
      return writeActivity({
        kind: "person",
        action: "updated",
        label: updated.name,
        icon: updated.icon,
        subjectId: personId,
      });
    });
    set((s) => ({
      people: s.people.map((p) => (p.id === personId ? updated : p)),
      activityEvents: [...s.activityEvents, event],
    }));
    return updated;
  },

  removePerson: async (personId) => {
    const localUser = await db.localUser.toCollection().first();
    if (personId === localUser?.id) {
      throw new Error("You cannot delete yourself from the people directory");
    }
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

    const affectedGroups = get().groups.filter((g) =>
      g.frequentPayerIds.some((id) => memberIds.includes(id)),
    );
    const event = await db.transaction(
      "rw",
      db.people,
      db.members,
      db.groups,
      db.activityEvents,
      async () => {
        const person = await db.people.get(personId);
        if (!person) throw new Error("Person not found");
        await db.people.delete(personId);
        await db.members.bulkDelete(memberIds);
        for (const group of affectedGroups) {
          const frequentPayerIds = group.frequentPayerIds.filter((id) => !memberIds.includes(id));
          await db.groups.update(group.id, { frequentPayerIds });
        }
        return writeActivity({
          kind: "person",
          action: "deleted",
          label: person.name,
          icon: person.icon,
          subjectId: personId,
        });
      },
    );

    set((s) => ({
      activityEvents: [...s.activityEvents, event],
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
