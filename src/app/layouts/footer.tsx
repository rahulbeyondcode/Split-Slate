import { NavLink, useParams } from "react-router-dom";

import { FOOTER_NAV } from "@/app/layouts/nav-config";

const AppFooter = () => {
  const { groupId } = useParams();

  const routeSlug = groupId ? "group" : "dashboard";

  const items = (FOOTER_NAV[routeSlug] ?? []).map((item) => ({
    ...item,
    path: groupId ? item.path.replace(":groupId", groupId) : item.path,
  }));

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.path}
          end
          className={({ isActive }) =>
            `flex-1 py-3 flex items-center justify-center text-xs font-medium transition-colors ${
              isActive ? "text-blue-600" : "text-gray-500"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default AppFooter;
