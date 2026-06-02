import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useStore } from "@/shared/configs/store";

const RouteProtector = () => {
  const { initialized, onboardingComplete, onboardingLastCompletedStep, onboardingGroupId } =
    useStore();
  const { pathname } = useLocation();

  if (!initialized) return null;

  const onOnboarding = pathname.startsWith("/onboarding");
  const onSetup = pathname.startsWith("/onboarding/setup");
  const started = onboardingLastCompletedStep !== null || onboardingGroupId !== null;

  // Finished users never see onboarding again
  if (onOnboarding && onboardingComplete) return <Navigate to="/dashboard" replace />;

  // Unfinished users can't reach the app
  if (pathname.startsWith("/dashboard") && !onboardingComplete)
    return <Navigate to="/onboarding" replace />;

  // Auto-resume: a started-but-unfinished session jumps from the intro straight into setup
  if (onOnboarding && !onSetup && !onboardingComplete && started)
    return <Navigate to="/onboarding/setup" replace />;

  return <Outlet />;
};

export default RouteProtector;
