import { Link, NavLink, useParams } from "react-router-dom";

import GroupListItem from "@/features/groups-list/components/group-list-item";

import { useStore } from "@/shared/configs/store";

import { SIDEBAR_NAV } from "@/app/layouts/nav-config";
import AppLogo from "@/shared/ui/app-logo";
import Avatar from "@/shared/ui/avatar";

const AppSidebar = () => {
  const { groupId } = useParams();
  const { localUser, groups } = useStore();
  const items = SIDEBAR_NAV[groupId ? "group" : "dashboard"].map((item) => ({
    ...item,
    path: groupId ? item.path.replace(":groupId", groupId) : item.path,
  }));

  return (
    <aside className="app-sidebar" aria-label="Sidebar">
      <div className="px-2 mb-5">
        <AppLogo />
      </div>
      <nav
        aria-label={groupId ? "Group navigation" : "Main navigation"}
        className="flex flex-col gap-1"
      >
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.label !== "Expenses"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 flex items-center justify-between px-3">
        <span className="eyebrow">Groups</span>
        <Link
          to="/groups/new"
          aria-label="New group"
          className="chip chip-selected !p-1 !rounded-lg !text-lg !leading-none"
        >
          ＋
        </Link>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto space-y-1">
        {groups
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((group) => (
            <GroupListItem key={group.id} groupId={group.id} />
          ))}
        {groups.length === 0 && <p className="soft-caption px-3 py-3">No groups yet</p>}
      </div>
      <Link
        to="/settings"
        className="flex items-center gap-2 border-t border-[var(--line)] px-2 pt-4"
      >
        <Avatar icon={localUser?.icon} name={localUser?.name} />
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold">{localUser?.name}</span>
          <span className="soft-caption">On this device</span>
        </span>
      </Link>
    </aside>
  );
};

export default AppSidebar;
