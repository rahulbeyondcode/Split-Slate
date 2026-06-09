interface NavItem {
  label: string;
  path: string;
}

export const SIDEBAR_NAV: Record<string, NavItem[]> = {
  dashboard: [
    { label: "Dashboard", path: "/dashboard" },
    { label: "All Friends", path: "/friends" },
  ],
  group: [
    { label: "Overview", path: "/groups/:groupId" },
    { label: "Expenses", path: "/groups/:groupId/expenses" },
    { label: "Members", path: "/groups/:groupId/members" },
    { label: "Categories & Tags", path: "/groups/:groupId/categories" },
    { label: "Settings", path: "/groups/:groupId/settings" },
  ],
};

export const FOOTER_NAV: Record<string, NavItem[]> = {
  dashboard: [
    { label: "Groups", path: "/dashboard" },
    { label: "Activity", path: "/activity" },
    { label: "Unsettled", path: "/unsettled" },
    { label: "Analytics", path: "/analytics" },
    { label: "Settings", path: "/settings" },
  ],
  group: [
    { label: "Overview", path: "/groups/:groupId" },
    { label: "Expenses", path: "/groups/:groupId/expenses" },
    { label: "Members", path: "/groups/:groupId/members" },
    { label: "Categories & Tags", path: "/groups/:groupId/categories" },
    { label: "Settings", path: "/groups/:groupId/settings" },
  ],
};
