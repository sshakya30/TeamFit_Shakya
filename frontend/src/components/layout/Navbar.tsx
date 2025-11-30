/**
 * Main navigation bar component
 * Shows different options based on authentication status
 */

import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser as useClerkUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';

export function Navbar() {
  const { user } = useClerkUser();
  const { data: dashboardData, isLoading } = useUser();

  const userRole = dashboardData?.teamMember?.role;
  const canAccessMaterials =
    (userRole === 'manager' || userRole === 'admin') &&
    dashboardData?.organization?.subscription_status === 'active' &&
    dashboardData?.organization?.subscription_plan !== 'free';

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary">
          TEAMFIT
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link to="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link to="/activities">
              <Button variant="ghost">Activities</Button>
            </Link>
            {isLoading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            ) : canAccessMaterials ? (
              <Link to="/materials">
                <Button variant="ghost">Materials</Button>
              </Link>
            ) : null}
            <Link to="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
