/**
 * Main App component with routing
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Landing } from './pages/Landing';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { ActivityLibrary } from './pages/ActivityLibrary';
import { CustomizeActivity } from './pages/CustomizeActivity';
import { Onboarding } from './pages/Onboarding';
import { TeamManagement } from './pages/TeamManagement';
import { Materials } from './pages/Materials';
import { GenerateActivity } from './pages/GenerateActivity';
import { OnboardingRoute } from './components/layout/OnboardingRoute';
import { MaterialsRoute } from './components/layout/MaterialsRoute';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/sign-in/*" element={<SignIn />} />
            <Route path="/sign-up/*" element={<SignUp />} />

            {/* Onboarding route - requires auth but not completed onboarding */}
            <Route
              path="/onboarding"
              element={
                <OnboardingRoute requiresOnboarding>
                  <Onboarding />
                </OnboardingRoute>
              }
            />

            {/* Protected routes - require completed onboarding */}
            <Route
              path="/dashboard"
              element={
                <OnboardingRoute>
                  <Dashboard />
                </OnboardingRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <OnboardingRoute>
                  <Profile />
                </OnboardingRoute>
              }
            />
            <Route
              path="/activities"
              element={
                <OnboardingRoute>
                  <ActivityLibrary />
                </OnboardingRoute>
              }
            />
            <Route
              path="/customize/:activityId"
              element={
                <OnboardingRoute>
                  <CustomizeActivity />
                </OnboardingRoute>
              }
            />
            <Route
              path="/team/:teamId/manage"
              element={
                <OnboardingRoute>
                  <TeamManagement />
                </OnboardingRoute>
              }
            />
            <Route
              path="/team/:teamId/invite"
              element={
                <OnboardingRoute>
                  <TeamManagement />
                </OnboardingRoute>
              }
            />
            <Route
              path="/materials"
              element={
                <OnboardingRoute>
                  <MaterialsRoute>
                    <Materials />
                  </MaterialsRoute>
                </OnboardingRoute>
              }
            />
            <Route
              path="/generate"
              element={
                <OnboardingRoute>
                  <MaterialsRoute>
                    <GenerateActivity />
                  </MaterialsRoute>
                </OnboardingRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
