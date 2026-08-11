import { createBrowserRouter, Navigate } from "react-router-dom";

import CategoriesAndTags from "@/features/group-detail/components/categories-and-tags";
import ExpenseList from "@/features/group-detail/components/expense-list";
import GroupOverview from "@/features/group-detail/components/group-overview";
import GroupSettings from "@/features/group-detail/components/group-settings";
import MemberList from "@/features/group-detail/components/member-list";
import FeatureCarousel from "@/features/onboarding/components/feature-carousel";
import SetupFlow from "@/features/onboarding/components/setup-flow";
import PeopleList from "@/features/people/components/people-list";

import AppLayout from "@/app/layouts";
import RouteProtector from "@/app/router/route-protector";
import CreateGroup from "@/features/create-group";
import Dashboard from "@/features/dashboard";
import GroupDetail from "@/features/group-detail";

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
          { path: "/friends", element: <PeopleList /> },
          { path: "/groups/new", element: <CreateGroup /> },
          {
            path: "/groups/:groupId",
            element: <GroupDetail />,
            children: [
              { index: true, element: <GroupOverview /> },
              { path: "expenses", element: <ExpenseList /> },
              { path: "members", element: <MemberList /> },
              { path: "categories", element: <CategoriesAndTags /> },
              { path: "settings", element: <GroupSettings /> },
            ],
          },
        ],
      },
    ],
  },
]);
