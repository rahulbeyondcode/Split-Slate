import { createBrowserRouter, Navigate } from "react-router-dom";

import FeatureCarousel from "@/features/onboarding/components/feature-carousel";
import SetupFlow from "@/features/onboarding/components/setup-flow";

import AppLayout from "@/app/layouts";
import RouteProtector from "@/app/router/route-protector";
import CreateGroup from "@/features/create-group";
import Dashboard from "@/features/dashboard";

export const router = createBrowserRouter([
  {
    element: <RouteProtector />,
    children: [
      { path: "/", element: <Navigate to="/onboarding" replace /> },
      { path: "/onboarding", element: <FeatureCarousel /> },
      { path: "/onboarding/setup", element: <SetupFlow /> },
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/groups/new", element: <CreateGroup /> },
        ],
      },
    ],
  },
]);
