import { useLocation } from "react-router-dom";

import LivePreview from "@/features/create-group/components/live-preview";
import Activity from "@/features/dashboard/components/activity";

const ActivityPanel = () => {
  const { pathname } = useLocation();
  const groupId = pathname.match(/^\/groups\/([^/]+)/)?.[1];
  return (
    <aside
      className="activity-panel"
      aria-label={pathname === "/groups/new" ? "Group preview" : "Recent activity"}
    >
      {pathname === "/groups/new" ? <LivePreview /> : <Activity compact groupId={groupId} />}
    </aside>
  );
};

export default ActivityPanel;
