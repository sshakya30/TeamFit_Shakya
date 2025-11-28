/**
 * Complete step component
 * Final step showing success and next steps
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCompleteOnboarding } from '@/hooks/useCompleteOnboarding';

interface CompleteStepProps {
  onComplete: () => void;
}

export function CompleteStep({ onComplete }: CompleteStepProps) {
  const completeOnboarding = useCompleteOnboarding();

  // Mark onboarding as complete when this step loads
  useEffect(() => {
    completeOnboarding.mutate();
  }, []);

  return (
    <div className="space-y-6 text-center">
      <div className="text-6xl mb-4">
        <span role="img" aria-label="celebration">&#127881;</span>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-medium">You're all set!</h3>
        <p className="text-muted-foreground">
          Your organization and team are ready to go.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 text-left space-y-4">
        <p className="text-sm font-medium">What's next?</p>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 text-primary">&#8594;</span>
            <span>Browse our Activity Library to find team-building activities</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 text-primary">&#8594;</span>
            <span>Customize activities using AI to match your team's context</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 text-primary">&#8594;</span>
            <span>Schedule events and gather feedback from your team</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 text-primary">&#8594;</span>
            <span>Invite more team members as your team grows</span>
          </li>
        </ul>
      </div>

      <Button
        onClick={onComplete}
        size="lg"
        className="w-full sm:w-auto px-8"
        disabled={completeOnboarding.isPending}
      >
        Go to Dashboard
      </Button>
    </div>
  );
}
