import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Settings2,
  Shapes,
  UsersRound,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const SIDEBAR_NAV: Record<string, NavItem[]> = {
  dashboard: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Contacts", path: "/friends", icon: UsersRound },
    { label: "Settings", path: "/settings", icon: Settings2 },
  ],
  group: [
    { label: "Overview", path: "/groups/:groupId", icon: LayoutDashboard },
    { label: "Expenses", path: "/groups/:groupId/expenses", icon: ReceiptText },
    { label: "Members", path: "/groups/:groupId/members", icon: UsersRound },
    { label: "Categories & Tags", path: "/groups/:groupId/categories", icon: Shapes },
    { label: "Settings", path: "/groups/:groupId/settings", icon: Settings2 },
  ],
};

export const FOOTER_NAV: Record<string, NavItem[]> = {
  dashboard: [
    { label: "Groups", path: "/dashboard", icon: LayoutDashboard },
    { label: "Activity", path: "/activity", icon: Activity },
    { label: "New group", path: "/groups/new", icon: Plus },
    { label: "Unsettled", path: "/unsettled", icon: ArrowLeftRight },
    { label: "Settings", path: "/settings", icon: Settings2 },
  ],
  group: [
    { label: "Overview", path: "/groups/:groupId", icon: LayoutDashboard },
    { label: "Expenses", path: "/groups/:groupId/expenses", icon: ReceiptText },
    { label: "Members", path: "/groups/:groupId/members", icon: UsersRound },
    { label: "Cats & Tags", path: "/groups/:groupId/categories", icon: Shapes },
    { label: "Settings", path: "/groups/:groupId/settings", icon: Settings2 },
  ],
};
