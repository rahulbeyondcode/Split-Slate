import { createBrowserRouter, Navigate } from "react-router-dom";

import Activity from "@/features/activity/components/activity-feed";
import Analytics from "@/features/dashboard/components/analytics";
import Unsettled from "@/features/dashboard/components/unsettled";
import ExpenseDetail from "@/features/expenses/components/expense-detail";
import ExpenseForm from "@/features/expenses/components/expense-form";
import CategoriesAndTags from "@/features/group-detail/components/categories-and-tags";
import ExpenseList from "@/features/group-detail/components/expense-list";
import GroupBalances from "@/features/group-detail/components/group-balances";
import GroupOverview from "@/features/group-detail/components/group-overview";
import GroupSettings from "@/features/group-detail/components/group-settings";
import MemberList from "@/features/group-detail/components/member-list";
import ImportGroup from "@/features/import-export/components/import-group";
import RestoreBackup from "@/features/import-export/components/restore-backup";
import FeatureCarousel from "@/features/onboarding/components/feature-carousel";
import SetupFlow from "@/features/onboarding/components/setup-flow";
import PeopleList from "@/features/people/components/people-list";
import AppSettings from "@/features/settings/components/app-settings";

import AppLayout from "@/app/layouts";
import ScrollReset from "@/app/layouts/scroll-reset";
import RouteError from "@/app/router/route-error";
import RouteProtector from "@/app/router/route-protector";
import CreateGroup from "@/features/create-group";
import Dashboard from "@/features/dashboard";
import GroupDetail from "@/features/group-detail";

export const router = createBrowserRouter([
  {
    element: <ScrollReset />,
    errorElement: <RouteError />,
    children: [
      { path: "/import", element: <ImportGroup /> },
      { path: "/restore", element: <RestoreBackup /> },
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
              { path: "/activity", element: <Activity /> },
              { path: "/unsettled", element: <Unsettled /> },
              { path: "/analytics", element: <Analytics /> },
              { path: "/settings", element: <AppSettings /> },
              { path: "/friends", element: <PeopleList /> },
              { path: "/groups/new", element: <CreateGroup /> },
              {
                path: "/groups/:groupId",
                element: <GroupDetail />,
                children: [
                  { index: true, element: <GroupOverview /> },
                  { path: "expenses", element: <ExpenseList /> },
                  { path: "expenses/new", element: <ExpenseForm /> },
                  { path: "expenses/:expenseId", element: <ExpenseDetail /> },
                  { path: "expenses/:expenseId/edit", element: <ExpenseForm /> },
                  { path: "balances", element: <GroupBalances /> },
                  { path: "members", element: <MemberList /> },
                  { path: "categories", element: <CategoriesAndTags /> },
                  { path: "settings", element: <GroupSettings /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
