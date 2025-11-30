/**
 * Sign-in page using Clerk components
 */

import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { Layout } from '@/components/layout/Layout';

export function SignIn() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <ClerkSignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </Layout>
  );
}
