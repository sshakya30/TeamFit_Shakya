/**
 * Onboarding route wrapper
 * Redirects users who haven't completed onboarding to the onboarding flow
 * Redirects users who have completed onboarding away from onboarding page
 */

import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

interface OnboardingRouteProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean; // true for /onboarding page, false for protected routes
}

export function OnboardingRoute({ children, requiresOnboarding = false }: OnboardingRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const { data: onboardingState, isLoading, error } = useOnboardingStatus();

  // Show loading while checking auth and onboarding status
  if (!isLoaded || (isSignedIn && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // Handle error state - allow access but log error
  if (error) {
    console.error('Error fetching onboarding status:', error);
    // On error, allow access to avoid blocking users
    return <>{children}</>;
  }

  // For the onboarding page: redirect to dashboard if already completed
  if (requiresOnboarding) {
    if (onboardingState?.isComplete) {
      return <Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // For protected routes: redirect to onboarding if not completed
  if (!onboardingState?.isComplete) {
    // Don't redirect if we're already on the onboarding page
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
