import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  ChartNoAxesCombined,
  FolderInput,
  LayoutDashboard,
  Plus,
  ReceiptText,
  RotateCcw,
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
    { label: "Activity", path: "/activity", icon: Activity },
    { label: "Contacts", path: "/friends", icon: UsersRound },
    { label: "Settings", path: "/settings", icon: Settings2 },
  ],
  group: [
    { label: "Overview", path: "/groups/:groupId", icon: LayoutDashboard },
    { label: "Activity", path: "/groups/:groupId/activity", icon: Activity },
    { label: "Expenses", path: "/groups/:groupId/expenses", icon: ReceiptText },
    { label: "Balances", path: "/groups/:groupId/balances", icon: ArrowLeftRight },
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
  ],
  group: [
    { label: "Overview", path: "/groups/:groupId", icon: LayoutDashboard },
    { label: "Expenses", path: "/groups/:groupId/expenses", icon: ReceiptText },
    { label: "Add", path: "/groups/:groupId/expenses/new", icon: Plus },
    { label: "Members", path: "/groups/:groupId/members", icon: UsersRound },
  ],
};

export const FOOTER_MORE_NAV: Record<string, NavItem[]> = {
  dashboard: [
    { label: "Contacts", path: "/friends", icon: UsersRound },
    { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined },
    { label: "Import", path: "/import", icon: FolderInput },
    { label: "Restore", path: "/restore", icon: RotateCcw },
    { label: "Settings", path: "/settings", icon: Settings2 },
  ],
  group: [
    { label: "Balances", path: "/groups/:groupId/balances", icon: ArrowLeftRight },
    { label: "Analytics", path: "/groups/:groupId/analytics", icon: ChartNoAxesCombined },
    { label: "Activity", path: "/groups/:groupId/activity", icon: Activity },
    { label: "Cats & Tags", path: "/groups/:groupId/categories", icon: Shapes },
    { label: "Settings", path: "/groups/:groupId/settings", icon: Settings2 },
  ],
};
