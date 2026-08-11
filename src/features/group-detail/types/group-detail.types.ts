import type { Category, Expense, Group, Member, Person, Tag } from "@/shared/types/domain.types";

export interface GroupMemberWithPerson extends Member {
  person?: Person;
}

export interface GroupDetailContext {
  group: Group;
  groupMembers: GroupMemberWithPerson[];
  groupCategories: Category[];
  groupTags: Tag[];
  groupExpenses: Expense[];
}
