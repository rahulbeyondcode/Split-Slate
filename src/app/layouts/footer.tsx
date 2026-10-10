import { Ellipsis, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";

import { FOOTER_MORE_NAV, FOOTER_NAV } from "@/app/layouts/nav-config";
import Icon from "@/shared/ui/icon";

const AppFooter = () => {
  const { groupId } = useParams();
  const { pathname, search } = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const navContext = groupId ? "group" : "dashboard";
  const items = FOOTER_NAV[navContext].map((item) => ({
    ...item,
    path: groupId
      ? `${item.path.replace(":groupId", groupId)}${item.label === "Add" ? search : ""}`
      : item.path,
  }));
  const moreItems = FOOTER_MORE_NAV[navContext].map((item) => ({
    ...item,
    path: groupId ? item.path.replace(":groupId", groupId) : item.path,
  }));
  const isMoreActive = moreItems.some((item) => item.path === pathname);

  const handleNavigation = () => setIsExpanded(false);
  const handleToggle = () => setIsExpanded((expanded) => !expanded);
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !isExpanded) return;
    event.stopPropagation();
    setIsExpanded(false);
    moreButton.current?.focus();
  };
  const renderNavItems = (navItems: typeof items) =>
    navItems.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.label !== "Expenses"}
        aria-label={item.label === "Add" ? "Add expense" : undefined}
        onClick={handleNavigation}
        className={({ isActive }) =>
          [
            isActive && "active",
            (item.path === "/groups/new" || item.label === "Add") && "mobile-nav-create",
          ]
            .filter(Boolean)
            .join(" ")
        }
      >
        <span className="nav-icon" aria-hidden="true">
          <Icon icon={item.icon} size={22} />
        </span>
        <span>{item.label}</span>
      </NavLink>
    ));

  return (
    <nav
      className="mobile-nav mobile-nav--expandable"
      aria-label="Bottom navigation"
      data-expanded={isExpanded}
      onKeyDown={handleKeyDown}
    >
      <div
        id="mobile-nav-more"
        className="mobile-nav-more"
        aria-hidden={!isExpanded}
        inert={!isExpanded}
      >
        <div className="mobile-nav-more-content">
          <div className="mobile-nav-row mobile-nav-more-row">{renderNavItems(moreItems)}</div>
        </div>
      </div>
      <div className="mobile-nav-row mobile-nav-primary-row">
        {renderNavItems(items)}
        <button
          ref={moreButton}
          type="button"
          className={`mobile-nav-toggle${isExpanded || isMoreActive ? " active" : ""}`}
          aria-expanded={isExpanded}
          aria-controls="mobile-nav-more"
          onClick={handleToggle}
        >
          <span className="nav-icon mobile-nav-toggle-icon" aria-hidden="true">
            <Icon icon={Ellipsis} size={22} className="mobile-nav-more-icon" />
            <Icon icon={X} size={22} className="mobile-nav-close-icon" />
          </span>
          <span>{isExpanded ? "Close" : "More"}</span>
        </button>
      </div>
    </nav>
  );
};

export default AppFooter;
