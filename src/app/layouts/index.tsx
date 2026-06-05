import { Outlet } from "react-router-dom";

import { useViewport } from "@/shared/hooks/use-viewport";

import ActivityPanel from "@/app/layouts/activity-panel";
import AppFooter from "@/app/layouts/footer";
import AppSidebar from "@/app/layouts/sidebar";

const AppLayout = () => {
  const { isMobile, isDesktop } = useViewport();

  return (
    <div className="flex h-svh overflow-hidden">
      {!isMobile && <AppSidebar />}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {isDesktop && <ActivityPanel />}
      {isMobile && <AppFooter />}
    </div>
  );
};

export default AppLayout;
