import dayjs from "dayjs";
import { v4 as uuid } from "uuid";

import type { DevDataType } from "@/features/dev-tools/utils/random-data";
import {
  CATEGORY_PRESETS,
  getAvailableDevName,
  getRandomDevData,
  pickRandom,
} from "@/features/dev-tools/utils/random-data";
import { db } from "@/shared/configs/db";
import { useStore } from "@/shared/configs/store";

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
  Tag,
} from "@/shared/types/domain.types";

export const onboardUser = async () => {
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
  const categories: Category[] = SEED_DEFAULT_GROUP_CATEGORIES.map((name) => ({
    id: uuid(),
    groupId: group.id,
    name,
    icon: SEED_MASTER_CATEGORIES.find((category) => category.name === name)?.icon ?? "📌",
    isActive: true,
  }));
  const tags: Tag[] = [
    { id: uuid(), groupId: group.id, name: "Trip", color: "#6366f1" },
    { id: uuid(), groupId: group.id, name: "Reimbursable", color: "#10b981" },
    { id: uuid(), groupId: group.id, name: "Recurring", color: "#f59e0b" },
  ];
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
      db.tags,
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
      await db.tags.bulkAdd(tags);
      await db.settings.bulkAdd(settings);
    },
  );
};

export const clearDatabase = async () => {
  await db.delete();
};

export const createDevItem = async (type: DevDataType, groupId?: string) => {
  const state = useStore.getState();
  if (!state.initialized || !state.onboardingComplete || !state.localUser) {
    throw new Error("Complete onboarding before creating development items");
  }

  if (type === "person") {
    const data = getRandomDevData(
      "person",
      state.people.map((person) => person.name),
    );
    const person = await state.addPerson(data.name, data.icon);
    return { message: `Created person: ${person.name}` };
  }

  if (type === "group") {
    const data = getRandomDevData(
      "group",
      state.groups.map((group) => group.name),
    );
    const { group } = await state.createGroup(data.name, data.icon, data.currency);
    const category = getRandomDevData("category");
    try {
      await state.addCategory(group.id, category.name, category.icon);
    } catch (error) {
      throw new Error(
        `Created group “${group.name}”, but its starter category could not be saved. Select the group and add a category before creating expenses.`,
        { cause: error },
      );
    }
    return { message: `Created group: ${group.name}`, groupId: group.id };
  }

  const group = state.groups.find((item) => item.id === groupId);
  if (!group) throw new Error("Select a group first");
  const members = state.members.filter((member) => member.groupId === group.id);

  if (type === "member") {
    const available = state.people.filter(
      (person) => !members.some((member) => member.personId === person.id),
    );
    let person = available.length ? pickRandom(available) : undefined;
    let createdPerson = false;
    if (!person) {
      const data = getRandomDevData(
        "member",
        state.people.map((item) => item.name),
      );
      person = await state.addPerson(data.name, data.icon);
      createdPerson = true;
    }
    try {
      await state.addMember(group.id, person.id);
    } catch (error) {
      if (createdPerson) {
        throw new Error(
          `Created person “${person.name}”, but membership could not be saved. The person remains available in the directory.`,
          { cause: error },
        );
      }
      throw error;
    }
    return { message: `Added ${person.name} to ${group.name}` };
  }

  const categories = state.categories.filter((category) => category.groupId === group.id);
  if (type === "category") {
    const data = getRandomDevData(
      "category",
      categories.map((category) => category.name),
    );
    const category = await state.addCategory(group.id, data.name, data.icon);
    return { message: `Created category: ${category.name}` };
  }

  const tags = state.tags.filter((tag) => tag.groupId === group.id);
  if (type === "tag") {
    const data = getRandomDevData(
      "tag",
      tags.map((tag) => tag.name),
    );
    const tag = await state.addTag(group.id, data.name, data.color);
    return { message: `Created tag: ${tag.name}` };
  }

  const validMembers = members.filter((member) =>
    state.people.some((person) => person.id === member.personId),
  );
  if (!validMembers.some((member) => member.personId === state.localUser?.id)) {
    throw new Error("Your membership could not be found in this group");
  }

  // Repeated expense titles are realistic; only directory names need suffixes.
  const data = getRandomDevData("expense");
  const matchingCategory = CATEGORY_PRESETS.find((category) => category.name === data.categoryName);
  if (!matchingCategory) throw new Error("The expense preset needs a matching category preset");
  let category = categories.find(
    (item) => item.isActive && item.name.trim().toLowerCase() === data.categoryName.toLowerCase(),
  );
  // Reuse a previously generated numbered variant if the original category is inactive.
  category ??= categories.find(
    (item) =>
      item.isActive &&
      /^\d+$/.test(item.name.slice(data.categoryName.length + 1)) &&
      item.name.toLowerCase().startsWith(`${data.categoryName.toLowerCase()} `),
  );
  const createdCategory = !category;
  if (!category) {
    const name = getAvailableDevName(
      data.categoryName,
      categories.map((item) => item.name),
    );
    category = await state.addCategory(group.id, name, matchingCategory.icon);
  }

  try {
    const expense = await state.addExpense({
      groupId: group.id,
      currency: group.currency,
      values: {
        expenseName: data.name,
        amount: data.amount,
        when: dayjs()
          .subtract(Math.floor(Math.random() * 30 * 24 * 60), "minute")
          .format("YYYY-MM-DDTHH:mm"),
        categoryId: category.id,
        tagIds: [],
        payerMode: "single",
        payerId: pickRandom(validMembers).id,
        payers: [],
        splitType: "equal",
        participants: validMembers.map((member) => ({
          memberId: member.id,
          selected: true,
          value: "",
        })),
      },
    });
    return { message: `Created expense: ${expense.expenseName}` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Expense creation failed";
    throw new Error(
      createdCategory
        ? `${reason}. Category “${category.name}” was created and remains available.`
        : reason,
      { cause: error },
    );
  }
};
