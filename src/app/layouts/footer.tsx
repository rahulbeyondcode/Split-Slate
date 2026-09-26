import { NavLink, useParams } from "react-router-dom";

import { FOOTER_NAV } from "@/app/layouts/nav-config";

const AppFooter = () => {
  const { groupId } = useParams();
  const items = FOOTER_NAV[groupId ? "group" : "dashboard"].map((item) => ({
    ...item,
    path: groupId ? item.path.replace(":groupId", groupId) : item.path,
  }));
  return (
    <nav className="mobile-nav" aria-label="Bottom navigation">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.label !== "Expenses"}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <span className="nav-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default AppFooter;
