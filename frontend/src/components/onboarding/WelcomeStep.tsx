/**
 * Welcome step component
 * First step in onboarding - greets user and explains the process
 */

import { Button } from '@/components/ui/button';

interface WelcomeStepProps {
  userName: string;
  onNext: () => void;
}

export function WelcomeStep({ userName, onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h3 className="text-xl font-medium">Hi {userName}!</h3>
        <p className="text-muted-foreground">
          Welcome to TEAMFIT - your AI-powered team-building platform.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 text-left space-y-4">
        <p className="text-sm text-muted-foreground">
          In the next few steps, you'll:
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              1
            </span>
            <span className="text-sm">Create your organization</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              2
            </span>
            <span className="text-sm">Set up your first team</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              3
            </span>
            <span className="text-sm">Tell us about your team so we can personalize activities</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              4
            </span>
            <span className="text-sm">Invite your team members</span>
          </li>
        </ul>
      </div>

      <p className="text-sm text-muted-foreground">
        This takes about 5 minutes. Let's get started!
      </p>

      <Button onClick={onNext} size="lg" className="w-full sm:w-auto px-8">
        Get Started
      </Button>
    </div>
  );
}
