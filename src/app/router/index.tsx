import { createBrowserRouter, Navigate } from 'react-router-dom'
import RouteProtector from '@/app/router/route-protector'

import OnboardingPage from '@/app/pages/onboarding-page'
import GroupsList from '@/app/pages/groups-list'
import SetupFlow from '@/features/onboarding/components/setup-flow'

export const router = createBrowserRouter([
  {
    element: <RouteProtector />,
    children: [
      { path: '/', element: <Navigate to="/onboarding" replace /> },
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/onboarding/setup', element: <SetupFlow /> },
      { path: '/dashboard', element: <GroupsList /> },
    ],
  },
])
