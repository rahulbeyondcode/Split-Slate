import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { useViewport } from "@/shared/hooks/use-viewport";

import ActivityPanel from "@/app/layouts/activity-panel";
import AppFooter from "@/app/layouts/footer";
import AppSidebar from "@/app/layouts/sidebar";

const AppLayout = () => {
  const { isMobile, isDesktop } = useViewport();
  const { pathname } = useLocation();
  const isExpenseForm = /^\/groups\/[^/]+\/expenses\/(new|[^/]+\/edit)$/.test(pathname);
  const groupId = pathname.match(/^\/groups\/([^/]+)(?:\/|$)/)?.[1];
  const groupSettingsPath = groupId ? `/groups/${groupId}/settings` : "";
  const showActivity =
    pathname === "/dashboard" ||
    Boolean(
      groupId &&
      groupId !== "new" &&
      pathname !== groupSettingsPath &&
      !pathname.startsWith(`${groupSettingsPath}/`),
    );

  useEffect(() => {
    document.documentElement.dataset.theme =
      localStorage.getItem("split-slate-theme") === "dark" ? "dark" : "light";
  }, []);

  return (
    <div className="app-shell">
      {!isMobile && !isExpenseForm && <AppSidebar />}
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
      {isDesktop && (pathname === "/groups/new" || showActivity) && <ActivityPanel />}
      {isMobile && !isExpenseForm && <AppFooter />}
    </div>
  );
};

export default AppLayout;
