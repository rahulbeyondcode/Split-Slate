export interface LocalUser {
  id: string;
  name: string;
  icon: string;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  currency: string;
  createdAt: number;
  frequentPayerIds: string[];
}

export interface Member {
  id: string;
  groupId: string;
  name: string;
  icon: string;
}

export interface Category {
  id: string;
  groupId: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export interface SplitMeta {
  memberId: string;
  value: number;
}

export interface Transaction {
  memberId: string;
  amount: number;
}

export interface Expense {
  expenseId: string;
  groupId: string;
  expenseName: string;
  createdBy: string;
  categoryId: string;
  createdAt: number;
  when: number;
  splitType: "equal" | "amount" | "shares" | "percentage" | "adjustment";
  splitMeta: SplitMeta[];
  transactions: {
    paid: Transaction[];
    owes: Transaction[];
  };
  tagIds: string[];
  attachmentIds: string[];
}

export interface Attachment {
  id: string;
  expenseId: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export type SetupStep = "identity" | "group" | "currency" | "categories" | "members";

export interface OnboardingSettings {
  id: "onboarding";
  lastCompletedStep: SetupStep | null;
  groupId: string | null;
  complete: boolean;
}

export interface CategorySettings {
  id: "categories";
  master: { name: string; icon: string }[];
  default: string[];
}

export type SettingsRecord = OnboardingSettings | CategorySettings;
