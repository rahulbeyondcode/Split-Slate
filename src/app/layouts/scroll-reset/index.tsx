import { Outlet } from "react-router-dom";

import { useScrollToTop } from "@/shared/hooks/use-scroll-to-top";

const ScrollReset = () => {
  useScrollToTop();

  return <Outlet />;
};

export default ScrollReset;
