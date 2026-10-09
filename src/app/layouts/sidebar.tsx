import { ArrowLeft, Plus } from "lucide-react";
import { Link, NavLink, useParams } from "react-router-dom";

import GroupListItem from "@/features/groups-list/components/group-list-item";

import { useStore } from "@/shared/configs/store";
import { useViewport } from "@/shared/hooks/use-viewport";

import { SIDEBAR_NAV } from "@/app/layouts/nav-config";
import AppLogo from "@/shared/ui/app-logo";
import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";

const AppSidebar = () => {
  const { groupId } = useParams();
  const { isTablet } = useViewport();
  const { localUser, groups, members, expenses } = useStore();
  const group = groups.find((item) => item.id === groupId);
  const items = SIDEBAR_NAV[groupId ? "group" : "dashboard"]
    .filter((item) => isTablet || item.label !== "Activity")
    .map((item) => ({
      ...item,
      path: groupId ? item.path.replace(":groupId", groupId) : item.path,
    }));

  return (
    <aside className="app-sidebar" aria-label="Sidebar">
      <div className="px-2 mb-5">
        <AppLogo />
      </div>
      {groupId && (
        <div className="sidebar-group-context">
          <Link to="/dashboard" className="sidebar-back-link">
            <Icon icon={ArrowLeft} size={18} /> All groups
          </Link>
          {group && (
            <div className="sidebar-group-summary">
              <Avatar icon={group.icon} square className="!h-11 !w-11 !text-2xl" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{group.name}</p>
                <p className="soft-caption">
                  {members.filter((member) => member.groupId === group.id).length} members ·{" "}
                  {expenses.filter((expense) => expense.groupId === group.id).length} expenses
                </p>
                <p className="soft-caption">{group.currency}</p>
              </div>
            </div>
          )}
          <span className="eyebrow">In this group</span>
        </div>
      )}
      <nav
        aria-label={groupId ? "Group navigation" : "Main navigation"}
        className={
          groupId ? "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto" : "flex flex-col gap-1"
        }
      >
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.label !== "Expenses"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon" aria-hidden="true">
              <Icon icon={item.icon} size={20} />
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      {!groupId && (
        <>
          <div className="mt-8 flex items-center justify-between px-3">
            <span className="eyebrow">Groups</span>
            <Link
              to="/groups/new"
              aria-label="New group"
              className="chip chip-selected !p-1 !rounded-lg !text-lg !leading-none"
            >
              <Icon icon={Plus} size={20} />
            </Link>
          </div>
          <div className="mt-3 flex-1 overflow-y-auto space-y-1">
            {groups
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((item) => (
                <GroupListItem key={item.id} groupId={item.id} />
              ))}
            {groups.length === 0 && <p className="soft-caption px-3 py-3">No groups yet</p>}
          </div>
        </>
      )}
      <Link
        to="/settings"
        className="mt-auto flex items-center gap-2 border-t border-[var(--line)] px-2 pt-4"
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
