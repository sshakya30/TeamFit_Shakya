/**
 * Landing page - public homepage
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

export function Landing() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <h1 className="text-5xl font-bold mb-4">
          Build Stronger Remote Teams
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
          AI-powered team-building activities tailored to your team's
          personality, work style, and preferences. Say goodbye to generic
          icebreakers.
        </p>
        <div className="flex gap-4">
          <Link to="/sign-up">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link to="/sign-in">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">AI-Powered Matching</h3>
            <p className="text-sm text-muted-foreground">
              Activities tailored to your team's unique dynamics
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Easy Scheduling</h3>
            <p className="text-sm text-muted-foreground">
              Zoom integration and automated reminders
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Track Engagement</h3>
            <p className="text-sm text-muted-foreground">
              Analytics to improve team satisfaction
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
