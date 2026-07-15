import { useState } from "react";
import { v4 as uuid } from "uuid";

import { db } from "@/shared/configs/db";

import {
  SEED_DEFAULT_GROUP_CATEGORIES,
  SEED_MASTER_CATEGORIES,
} from "@/shared/constants/categories";
import type {
  Category,
  Group,
  LocalUser,
  Member,
  Person,
  SettingsRecord,
} from "@/shared/types/domain.types";

const onboardUser = async () => {
  const localUser: LocalUser = {
    id: uuid(),
    name: "Rahul R",
    icon: "🧑‍💻",
  };
  const people: Person[] = [
    localUser,
    { id: uuid(), name: "Dracu", icon: "🧛" },
    { id: uuid(), name: "Zombuu", icon: "🧟" },
    { id: uuid(), name: "Geniee", icon: "🧜" },
    { id: uuid(), name: "Pandu", icon: "🐼" },
    { id: uuid(), name: "Foxxy", icon: "🦊" },
    { id: uuid(), name: "Simba", icon: "🦁" },
  ];
  const groupId = uuid();
  const members: Member[] = people.map((person) => ({
    id: uuid(),
    groupId,
    personId: person.id,
  }));
  const group: Group = {
    id: groupId,
    name: "Weekend Trip",
    icon: "🏕️",
    currency: "INR",
    createdAt: Date.now(),
    frequentPayerIds: members.slice(0, 5).map((member) => member.id),
  };
  const categories: Category[] = SEED_DEFAULT_GROUP_CATEGORIES.map((name, index) => ({
    id: `dev-category-${index}`,
    groupId: group.id,
    name,
    icon: SEED_MASTER_CATEGORIES.find((category) => category.name === name)?.icon ?? "📌",
    isActive: true,
  }));
  const settings: SettingsRecord[] = [
    {
      id: "onboarding",
      lastCompletedStep: "members",
      groupId: group.id,
      complete: true,
    },
    {
      id: "categories",
      master: SEED_MASTER_CATEGORIES,
      default: SEED_DEFAULT_GROUP_CATEGORIES,
    },
  ];

  await db.transaction(
    "rw",
    [
      db.localUser,
      db.groups,
      db.people,
      db.members,
      db.categories,
      db.expenses,
      db.attachments,
      db.settings,
    ],
    async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
      await db.localUser.add(localUser);
      await db.people.bulkAdd(people);
      await db.groups.add(group);
      await db.members.bulkAdd(members);
      await db.categories.bulkAdd(categories);
      await db.settings.bulkAdd(settings);
    },
  );
};

const clearDatabase = async () => {
  await db.delete();
};

const ACTIONS = [
  { label: "Onboard user", run: onboardUser },
  { label: "Clear database", run: clearDatabase },
] as const;

const DevTools = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (label: string, action: () => Promise<void>) => {
    setPendingAction(label);
    setError(null);

    try {
      await action();
      window.location.reload();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Development action failed");
      setPendingAction(null);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-2 right-2 z-50 rounded bg-amber-900 px-3 py-1.5 text-xs font-bold text-white shadow-md"
      >
        Dev tools
      </button>
    );
  }

  return (
    <div className="fixed top-2 right-2 z-50 flex min-h-11 items-center gap-2 rounded border border-amber-300 bg-amber-100 px-3 py-2 shadow-md">
      <span className="mr-1 text-xs font-bold uppercase tracking-wide text-amber-900">
        Dev tools
      </span>
      {ACTIONS.map(({ label, run }) => (
        <button
          key={label}
          type="button"
          disabled={pendingAction !== null}
          onClick={() => handleAction(label, run)}
          className="rounded bg-amber-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-wait disabled:opacity-50"
        >
          {pendingAction === label ? "Working…" : label}
        </button>
      ))}
      {error && <span className="text-xs font-medium text-red-700">{error}</span>}
      <button
        type="button"
        aria-label="Close development tools"
        onClick={() => setIsOpen(false)}
        className="ml-1 grid size-6 place-items-center rounded text-base leading-none text-amber-900 hover:bg-amber-200"
      >
        x
      </button>
    </div>
  );
};

export default DevTools;
