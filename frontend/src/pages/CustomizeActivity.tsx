/**
 * CustomizeActivity page for AI-powered activity customization
 * Allows users to customize public activities for their teams
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useBlocker } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useActivities } from '@/hooks/useActivities';
import { useUserTeams } from '@/hooks/useUserTeams';
import { useTeamProfile } from '@/hooks/useTeamProfile';
import { useCustomizeActivity } from '@/hooks/useCustomizeActivity';
import { useSaveActivity } from '@/hooks/useSaveActivity';
import { useQuota } from '@/hooks/useQuota';
import { DurationSelector } from '@/components/activities/DurationSelector';
import { TeamSelector } from '@/components/activities/TeamSelector';
import { TeamProfilePreview } from '@/components/activities/TeamProfilePreview';
import { CustomizationResult } from '@/components/activities/CustomizationResult';
import { QuotaDisplay } from '@/components/activities/QuotaDisplay';
import {
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from 'lucide-react';

type PageStep = 'setup' | 'processing' | 'result' | 'error';
type ErrorType = 'timeout' | 'quota' | 'network' | 'profile' | 'server' | null;

export function CustomizeActivity() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();

  // Data fetching
  const { data: activities, isLoading: isLoadingActivities } = useActivities();
  const { data: userTeams, isLoading: isLoadingTeams } = useUserTeams();
  const customizeMutation = useCustomizeActivity();
  const saveMutation = useSaveActivity();

  // Local state
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<15 | 30 | 45>(30);
  const [step, setStep] = useState<PageStep>('setup');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get the activity
  const activity = activities?.find((a) => a.id === activityId);

  // Auto-select first team when teams load
  useEffect(() => {
    if (userTeams && userTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(userTeams[0].team_id);
    }
  }, [userTeams, selectedTeamId]);

  // Get selected team and fetch its profile
  const selectedTeam = userTeams?.find((t) => t.team_id === selectedTeamId);
  const { data: teamProfile, isLoading: isLoadingProfile } = useTeamProfile(selectedTeamId);
  const { data: quota, refetch: refetchQuota } = useQuota(selectedTeam?.organization_id || null);
  const hasMultipleTeams = (userTeams?.length || 0) > 1;

  // Check if quota is exceeded
  const isQuotaExceeded = quota &&
    (quota.public_customizations_used ?? 0) >= (quota.public_customizations_limit ?? 5);

  // Navigation warning during processing
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      step === 'processing' && currentLocation.pathname !== nextLocation.pathname
  );

  // Browser close/refresh warning during processing
  useEffect(() => {
    if (step === 'processing') {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [step]);

  // Progress animation during processing
  useEffect(() => {
    if (step === 'processing') {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          // Slow down as we approach 90%
          if (prev >= 90) return prev;
          if (prev >= 70) return prev + 0.5;
          if (prev >= 50) return prev + 1;
          return prev + 2;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Handle successful customization
  useEffect(() => {
    if (customizeMutation.isSuccess) {
      setProgress(100);
      setShowSuccess(true);
      // Refetch quota to update the display
      refetchQuota();
      setTimeout(() => {
        setStep('result');
      }, 1500); // Show success animation for 1.5s
    }
  }, [customizeMutation.isSuccess, refetchQuota]);

  // Handle errors
  useEffect(() => {
    if (customizeMutation.isError) {
      const errorMessage = customizeMutation.error?.message || '';
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota')) {
        setErrorType('quota');
      } else if (errorMessage.includes('408') || errorMessage.toLowerCase().includes('timeout')) {
        setErrorType('timeout');
      } else if (errorMessage.includes('404') || errorMessage.toLowerCase().includes('profile')) {
        setErrorType('profile');
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        setErrorType('network');
      } else {
        setErrorType('server');
      }
      setStep('error');
    }
  }, [customizeMutation.isError, customizeMutation.error]);

  // Handle generate customization
  const handleGenerate = () => {
    if (!activity || !selectedTeam) return;

    setStep('processing');
    setShowSuccess(false);
    setErrorType(null);

    customizeMutation.mutate({
      team_id: selectedTeam.team_id,
      organization_id: selectedTeam.organization_id,
      public_activity_id: activity.id,
      duration_minutes: selectedDuration,
    });
  };

  // Handle retry
  const handleRetry = () => {
    customizeMutation.reset();
    setStep('setup');
    setErrorType(null);
    setProgress(0);
  };

  // Handle save activity
  const handleSave = () => {
    if (!customizeMutation.data) return;

    saveMutation.mutate(
      {
        activityId: customizeMutation.data.activity_id,
        status: 'saved',
      },
      {
        onSuccess: () => {
          // Redirect to activities page after successful save
          navigate('/activities');
        },
      }
    );
  };

  // Handle discard (back to library)
  const handleDiscard = () => {
    navigate('/activities');
  };

  // Loading state
  if (isLoadingActivities || isLoadingTeams) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  // Activity not found
  if (!activity) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Activity Not Found</CardTitle>
                <CardDescription>
                  The activity you're looking for doesn't exist.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/activities">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Activity Library
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  // No team access
  if (!selectedTeam && !isLoadingTeams) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <CardTitle>No Team Access</CardTitle>
                <CardDescription>
                  You need to be a manager or admin of a team to customize activities.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link to="/activities">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Activity Library
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back link */}
          <Link
            to="/activities"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activity Library
          </Link>

          {/* Main card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{activity.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Customize this activity for your team
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {activity.duration_minutes && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.duration_minutes} min
                    </Badge>
                  )}
                  {quota && (
                    <QuotaDisplay
                      used={quota.public_customizations_used ?? 0}
                      limit={quota.public_customizations_limit ?? 5}
                      type="public"
                    />
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Setup Step */}
              {step === 'setup' && selectedTeam && (
                <div className="space-y-6">
                  {/* Activity description */}
                  {activity.description && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  )}

                  {/* Team selector - only show if multiple teams */}
                  {hasMultipleTeams && userTeams && (
                    <TeamSelector
                      teams={userTeams}
                      selectedTeamId={selectedTeamId}
                      onSelect={setSelectedTeamId}
                      disabled={false}
                    />
                  )}

                  {/* Team profile preview */}
                  <TeamProfilePreview
                    profile={teamProfile || null}
                    isLoading={isLoadingProfile}
                    teamName={selectedTeam.teams.name}
                  />

                  {/* Duration selector */}
                  <DurationSelector
                    value={selectedDuration}
                    onChange={setSelectedDuration}
                    disabled={false}
                  />

                  {/* Quota exceeded warning */}
                  {isQuotaExceeded && (
                    <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-destructive">
                            Monthly limit reached
                          </p>
                          <p className="text-sm text-muted-foreground">
                            You've used all your customizations for this month.
                            Upgrade your plan for more customizations.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generate button */}
                  <Button
                    onClick={handleGenerate}
                    className="w-full"
                    size="lg"
                    disabled={isQuotaExceeded || (!teamProfile && !isLoadingProfile)}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    {isQuotaExceeded ? 'Quota Exceeded' : 'Generate Customization'}
                  </Button>

                  {/* Warning if no profile */}
                  {!teamProfile && !isLoadingProfile && !isQuotaExceeded && (
                    <p className="text-xs text-center text-yellow-600">
                      Set up your team profile to enable customization
                    </p>
                  )}
                </div>
              )}

              {/* Processing Step */}
              {step === 'processing' && (
                <div className="space-y-6 py-8">
                  <div className="text-center space-y-4">
                    {showSuccess ? (
                      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                          <CheckCircle2 className="h-16 w-16 text-green-500" />
                          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                        </div>
                        <p className="text-lg font-medium text-green-600 mt-4">
                          Customization Complete!
                        </p>
                      </div>
                    ) : (
                      <>
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                        <div>
                          <p className="text-lg font-medium">
                            Generating your customized activity...
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Our AI is tailoring this activity for your team
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <Progress value={progress} className="w-full" />

                  <p className="text-xs text-center text-muted-foreground">
                    Please don't close this page while processing
                  </p>
                </div>
              )}

              {/* Result Step */}
              {step === 'result' && customizeMutation.data && (
                <CustomizationResult
                  activity={customizeMutation.data.activity}
                  quotas={customizeMutation.data.quotas_remaining}
                  onSave={handleSave}
                  onDiscard={handleDiscard}
                  isSaving={saveMutation.isPending}
                />
              )}

              {/* Error Step */}
              {step === 'error' && (
                <ErrorView
                  errorType={errorType}
                  onRetry={handleRetry}
                  onBackToLibrary={() => navigate('/activities')}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation blocker dialog */}
          {blocker.state === 'blocked' && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle>Leave Page?</CardTitle>
                  <CardDescription>
                    Your customization is still being generated. If you leave now,
                    your progress will be lost.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => blocker.reset?.()}
                  >
                    Stay
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => blocker.proceed?.()}
                  >
                    Leave
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

// Error view component
function ErrorView({
  errorType,
  onRetry,
  onBackToLibrary,
}: {
  errorType: ErrorType;
  onRetry: () => void;
  onBackToLibrary: () => void;
}) {
  const errorMessages: Record<NonNullable<ErrorType>, { title: string; message: string }> = {
    timeout: {
      title: 'Taking longer than expected',
      message: 'The AI is taking longer than usual. Please try again.',
    },
    quota: {
      title: 'Monthly limit reached',
      message: 'You\'ve reached your customization limit for this month.',
    },
    network: {
      title: 'Connection lost',
      message: 'Please check your internet connection and try again.',
    },
    profile: {
      title: 'Team profile required',
      message: 'Please complete your team profile before customizing activities.',
    },
    server: {
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again.',
    },
  };

  const error = errorMessages[errorType || 'server'];

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <div>
          <p className="text-lg font-medium">{error.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onBackToLibrary} variant="outline" className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
        {errorType !== 'quota' && errorType !== 'profile' && (
          <Button onClick={onRetry} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
