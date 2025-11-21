/**
 * Sign-up page using Clerk components
 */

import { SignUp as ClerkSignUp } from '@clerk/clerk-react';
import { Layout } from '@/components/layout/Layout';

export function SignUp() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <ClerkSignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />
      </div>
    </Layout>
  );
}
