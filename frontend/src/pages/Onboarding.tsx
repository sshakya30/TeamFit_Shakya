/**
 * Onboarding wizard page
 * Guides new users through organization and team setup
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Import step components
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { CreateOrganizationStep } from '@/components/onboarding/CreateOrganizationStep';
import { CreateTeamStep } from '@/components/onboarding/CreateTeamStep';
import { DelegateManagerStep } from '@/components/onboarding/DelegateManagerStep';
import { TeamProfileStep } from '@/components/onboarding/TeamProfileStep';
import { InviteMembersStep } from '@/components/onboarding/InviteMembersStep';
import { CompleteStep } from '@/components/onboarding/CompleteStep';

import type { OnboardingStep } from '@/types';

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'create_organization',
  'create_team',
  'delegate_manager',
  'team_profile',
  'invite_members',
  'complete'
];

const STEP_TITLES: Record<OnboardingStep, string> = {
  welcome: 'Welcome to TEAMFIT',
  create_organization: 'Create Your Organization',
  create_team: 'Create Your First Team',
  delegate_manager: 'Delegate Team Management',
  team_profile: 'Tell Us About Your Team',
  invite_members: 'Invite Team Members',
  complete: 'All Done!'
};

const STEP_DESCRIPTIONS: Record<OnboardingStep, string> = {
  welcome: 'Let\'s get you set up with your team-building platform',
  create_organization: 'Start by creating your organization',
  create_team: 'Now let\'s create your first team',
  delegate_manager: 'Would you like to delegate team management?',
  team_profile: 'Help us personalize activities for your team',
  invite_members: 'Bring your team members on board',
  complete: 'You\'re all set to start building stronger teams'
};

export function Onboarding() {
  const navigate = useNavigate();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { data: onboardingState, isLoading, error, refetch } = useOnboardingStatus();

  // Local state for tracking newly created resources during onboarding
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentStepOverride, setCurrentStepOverride] = useState<OnboardingStep | null>(null);

  // Determine current step
  const currentStep = currentStepOverride || onboardingState?.currentStep || 'welcome';
  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  // Sync organization and team IDs from server state
  useEffect(() => {
    if (onboardingState?.organizationId && !organizationId) {
      setOrganizationId(onboardingState.organizationId);
    }
    if (onboardingState?.teamId && !teamId) {
      setTeamId(onboardingState.teamId);
    }
  }, [onboardingState, organizationId, teamId]);

  // Redirect if onboarding is complete
  useEffect(() => {
    if (onboardingState?.isComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [onboardingState?.isComplete, navigate]);

  // Handle navigation to next step
  const handleNext = (nextStep?: OnboardingStep) => {
    if (nextStep) {
      setCurrentStepOverride(nextStep);
    } else {
      const nextIndex = stepIndex + 1;
      if (nextIndex < STEP_ORDER.length) {
        setCurrentStepOverride(STEP_ORDER[nextIndex]);
      }
    }
    refetch();
  };

  // Handle navigation to previous step
  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStepOverride(STEP_ORDER[prevIndex]);
    }
  };

  // Handle organization created
  const handleOrganizationCreated = (orgId: string) => {
    setOrganizationId(orgId);
    handleNext('create_team');
  };

  // Handle team created
  const handleTeamCreated = (newTeamId: string) => {
    setTeamId(newTeamId);
    handleNext('delegate_manager');
  };

  // Handle skip delegation
  const handleSkipDelegation = () => {
    handleNext('team_profile');
  };

  // Handle complete onboarding
  const handleComplete = () => {
    navigate('/dashboard', { replace: true });
  };

  // Loading state
  if (!isUserLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => refetch()}
              className="text-primary hover:underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeStep
            userName={user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'there'}
            onNext={() => handleNext('create_organization')}
          />
        );

      case 'create_organization':
        return (
          <CreateOrganizationStep
            onSuccess={handleOrganizationCreated}
            onBack={handleBack}
          />
        );

      case 'create_team':
        return (
          <CreateTeamStep
            organizationId={organizationId!}
            onSuccess={handleTeamCreated}
            onBack={handleBack}
          />
        );

      case 'delegate_manager':
        return (
          <DelegateManagerStep
            teamId={teamId!}
            organizationId={organizationId!}
            onNext={() => handleNext('team_profile')}
            onSkip={handleSkipDelegation}
            onBack={handleBack}
          />
        );

      case 'team_profile':
        return (
          <TeamProfileStep
            teamId={teamId!}
            organizationId={organizationId!}
            onNext={() => handleNext('invite_members')}
            onBack={handleBack}
          />
        );

      case 'invite_members':
        return (
          <InviteMembersStep
            teamId={teamId!}
            organizationId={organizationId!}
            onNext={() => handleNext('complete')}
            onBack={handleBack}
          />
        );

      case 'complete':
        return (
          <CompleteStep
            onComplete={handleComplete}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {stepIndex + 1} of {STEP_ORDER.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">{STEP_TITLES[currentStep]}</CardTitle>
            <CardDescription className="text-base">
              {STEP_DESCRIPTIONS[currentStep]}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Step indicators */}
        <div className="flex justify-center mt-6 gap-2">
          {STEP_ORDER.map((step, index) => (
            <div
              key={step}
              className={`h-2 w-2 rounded-full transition-colors ${
                index <= stepIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
