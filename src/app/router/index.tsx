import { createBrowserRouter, Navigate } from 'react-router-dom'
import OnboardingPage from '@/app/pages/onboarding-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/onboarding" replace />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/onboarding/setup',
    element: <div style={{ padding: '2rem' }}>Setup flow — coming soon</div>,
  },
])
