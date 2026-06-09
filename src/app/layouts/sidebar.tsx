import { Link, NavLink, useParams } from "react-router-dom";

import GroupListItem from "@/features/groups-list/components/group-list-item";

import { useStore } from "@/shared/configs/store";

import { SIDEBAR_NAV } from "@/app/layouts/nav-config";

const AppSidebar = () => {
  const { groupId } = useParams();
  const { localUser, groups } = useStore();

  const isGroupOverview = !!groupId;

  const routeSlug = isGroupOverview ? "group" : "dashboard";
  const navItems = (SIDEBAR_NAV[routeSlug] ?? []).map((item) => ({
    ...item,
    path: groupId ? item.path.replace(":groupId", groupId) : item.path,
  }));

  return (
    <aside className="w-[20%] h-full shrink-0 flex flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-4 border-b border-gray-100">
        <span className="text-base font-semibold text-gray-900">Split Slate</span>
      </div>

      <nav className="px-3 py-3 border-b border-gray-100">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end
            className={({ isActive }) =>
              `block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your Groups</p>
          <Link to="/groups/new" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            + New
          </Link>
        </div>
        {groups
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((group) => <GroupListItem key={group.id} groupId={group.id} />)}
        {groups.length === 0 && (
          <p className="text-xs text-gray-400 px-3 py-2">No groups yet</p>
        )}
      </div>

<div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
        <span className="text-xl shrink-0">{localUser?.icon}</span>
        <span className="flex-1 text-sm text-gray-700 truncate">{localUser?.name}</span>
        <button className="text-gray-400 hover:text-gray-600 text-base">⚙</button>
      </div>
    </aside>
  );
};

export default AppSidebar;
