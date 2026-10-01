import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

import { useStore } from "@/shared/configs/store";

import StatusBanner from "@/shared/ui/status-banner";

const RouteProtector = () => {
  const {
    initialized,
    initError,
    onboardingComplete,
    onboardingLastCompletedStep,
    onboardingGroupId,
  } = useStore();
  const { pathname } = useLocation();

  if (initError) {
    return (
      <main className="page page-narrow mx-auto py-12">
        <h1 className="page-title">Your local data could not be opened</h1>
        <StatusBanner variant="error">{initError}</StatusBanner>
        <p className="my-4">
          Do not clear your browser data. Try reloading, or restore a saved backup.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
          <Link className="btn btn-secondary" to="/restore">
            Restore backup
          </Link>
        </div>
      </main>
    );
  }
  if (!initialized) return null;

  const onOnboardingPage = pathname.startsWith("/onboarding");
  const onOnboardingSetupPage = pathname.startsWith("/onboarding/setup");
  const didStartOnboarding = onboardingLastCompletedStep !== null || onboardingGroupId !== null;

  // Finished users never see onboarding again
  if (onOnboardingPage && onboardingComplete) return <Navigate to="/dashboard" replace />;

  // Unfinished users can't reach the app
  if (!pathname.includes("/onboarding") && !onboardingComplete)
    return <Navigate to="/onboarding" replace />;

  // Auto-resume: a started-but-unfinished session jumps from the intro straight into setup
  if (onOnboardingPage && !onOnboardingSetupPage && !onboardingComplete && didStartOnboarding)
    return <Navigate to="/onboarding/setup" replace />;

  return <Outlet />;
};

export default RouteProtector;
