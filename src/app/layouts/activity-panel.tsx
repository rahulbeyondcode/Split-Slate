import { useLocation } from "react-router-dom";

import LivePreview from "@/features/create-group/components/live-preview";

const DUMMY_ACTIVITY = [
  { icon: "🛵", title: "Arjun paid Scooty rentals", group: "Goa Trip", time: "2h ago", amount: "Rs 2,400" },
  { icon: "🍕", title: "Priya added Pizza night", group: "Flat mates", time: "5h ago", amount: "Rs 840" },
  { icon: "⛽", title: "Rahul paid Fuel", group: "Goa Trip", time: "Yesterday", amount: "Rs 1,200" },
  { icon: "🛒", title: "Sneha added Groceries", group: "Flat mates", time: "2d ago", amount: "Rs 620" },
  { icon: "🎟️", title: "Arjun paid Concert tickets", group: "Weekend", time: "3d ago", amount: "Rs 3,000" },
];

// The create/edit group flows take over the right pane to show a live preview of the draft.
const isGroupFormRoute = (pathname: string) =>
  pathname.startsWith("/groups/") && (pathname.endsWith("/new") || pathname.endsWith("/edit"));

const renderGroupLivePreview = () => (
  <div className="flex-1 overflow-y-auto p-5">
    <LivePreview />
  </div>
);

const renderActivityListing = () => (
  <>
    <div className="px-5 py-4 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-700">Activity</span>
    </div>
    <div className="flex-1 overflow-y-auto">
      {DUMMY_ACTIVITY.map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
          <span className="text-lg shrink-0">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{item.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {item.group} · {item.time}
            </p>
          </div>
          <span className="text-xs font-medium text-gray-700 shrink-0">{item.amount}</span>
        </div>
      ))}
    </div>
  </>
);

const ActivityPanel = () => {
  const { pathname } = useLocation();

  return (
    <aside className="w-[20%] h-full shrink-0 flex flex-col border-l border-gray-200 bg-white">
      {isGroupFormRoute(pathname) ? renderGroupLivePreview() : renderActivityListing()}
    </aside>
  );
};

export default ActivityPanel;
