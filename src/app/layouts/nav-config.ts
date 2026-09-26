interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const SIDEBAR_NAV: Record<string, NavItem[]> = {
  dashboard: [
    { label: "Dashboard", path: "/dashboard", icon: "▦" },
    { label: "Contacts", path: "/friends", icon: "☺" },
    { label: "Settings", path: "/settings", icon: "⚙" },
  ],
  group: [
    { label: "Overview", path: "/groups/:groupId", icon: "▦" },
    { label: "Expenses", path: "/groups/:groupId/expenses", icon: "₹" },
    { label: "Members", path: "/groups/:groupId/members", icon: "☺" },
    { label: "Categories & Tags", path: "/groups/:groupId/categories", icon: "◆" },
    { label: "Settings", path: "/groups/:groupId/settings", icon: "⚙" },
  ],
};

export const FOOTER_NAV: Record<string, NavItem[]> = {
  dashboard: [
    { label: "Groups", path: "/dashboard", icon: "▦" },
    { label: "Activity", path: "/activity", icon: "⊙" },
    { label: "Unsettled", path: "/unsettled", icon: "⇄" },
    { label: "Analytics", path: "/analytics", icon: "◔" },
    { label: "Settings", path: "/settings", icon: "⚙" },
  ],
  group: [
    { label: "Overview", path: "/groups/:groupId", icon: "▦" },
    { label: "Expenses", path: "/groups/:groupId/expenses", icon: "₹" },
    { label: "Members", path: "/groups/:groupId/members", icon: "☺" },
    { label: "Cats & Tags", path: "/groups/:groupId/categories", icon: "◆" },
    { label: "Settings", path: "/groups/:groupId/settings", icon: "⚙" },
  ],
};
