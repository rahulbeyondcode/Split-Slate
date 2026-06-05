import { createBrowserRouter, Navigate } from "react-router-dom";

import SetupFlow from "@/features/onboarding/components/setup-flow";

import AppLayout from "@/app/layouts";
import GroupsList from "@/app/pages/groups-list";
import OnboardingPage from "@/app/pages/onboarding-page";
import RouteProtector from "@/app/router/route-protector";

export const router = createBrowserRouter([
  {
    element: <RouteProtector />,
    children: [
      { path: "/", element: <Navigate to="/onboarding" replace /> },
      { path: "/onboarding", element: <OnboardingPage /> },
      { path: "/onboarding/setup", element: <SetupFlow /> },
      {
        element: <AppLayout />,
        children: [{ path: "/dashboard", element: <GroupsList /> }],
      },
    ],
  },
]);
