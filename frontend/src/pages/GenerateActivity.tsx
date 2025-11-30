/**
 * GenerateActivity page
 * Allows managers/admins to generate custom activities using AI
 */

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { RequirementsSection, validateRequirements } from '@/components/generate/RequirementsSection';
import { GenerationProgress } from '@/components/generate/GenerationProgress';
import { GenerationResults } from '@/components/generate/GenerationResults';
import { MaterialsSection } from '@/components/generate/MaterialsSection';
import { useUser } from '@/hooks/useUser';
import { useQuota } from '@/hooks/useQuota';
import { useGenerateActivities } from '@/hooks/useGenerateActivities';
import { useJobStatus } from '@/hooks/useJobStatus';
import { useSaveActivity } from '@/hooks/useSaveActivity';
import type { GenerationPageState } from '@/types';

const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * GenerateActivity page component
 * Handles the full custom activity generation flow with materials selection
 */
export function GenerateActivity() {
  const { data: userData } = useUser();
  const { data: quota, isLoading: quotaLoading, refetch: refetchQuota } = useQuota(
    userData?.organization?.id ?? null
  );

  // Form state
  const [requirements, setRequirements] = useState('');
  const [requirementsError, setRequirementsError] = useState<string | null>(null);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  // Page state machine
  const [pageState, setPageState] = useState<GenerationPageState>({ status: 'idle' });

  // Generation mutation
  const generateMutation = useGenerateActivities();

  // Save activity mutation
  const saveActivityMutation = useSaveActivity();

  // Job status polling (only when we have a jobId)
  const jobId = pageState.status === 'polling' ? pageState.jobId : null;
  const { data: jobStatus, error: jobError } = useJobStatus(jobId);

  // Saved activity IDs for tracking saves in results view
  const [savedActivityIds, setSavedActivityIds] = useState<Set<string>>(new Set());

  // Check quota limits
  const customUsed = quota?.custom_generations_used ?? 0;
  const customLimit = quota?.custom_generations_limit ?? 10;
  const isQuotaExceeded = customUsed >= customLimit;

  // Handle job status updates
  useEffect(() => {
    if (pageState.status !== 'polling') return;

    if (jobStatus) {
      if (jobStatus.status === 'completed' && jobStatus.activities) {
        setPageState({
          status: 'completed',
          jobId: pageState.jobId,
          activities: jobStatus.activities,
        });
        refetchQuota();
      } else if (jobStatus.status === 'failed') {
        setPageState({
          status: 'error',
          errorType: 'failed',
          message: jobStatus.error || 'Generation failed. Please try again.',
        });
      }
    }

    if (jobError) {
      setPageState({
        status: 'error',
        errorType: 'network',
        message: 'Network error. Please check your connection and try again.',
      });
    }

    // Check for timeout
    const elapsed = Date.now() - pageState.startTime;
    if (elapsed > TIMEOUT_MS) {
      setPageState({
        status: 'error',
        errorType: 'timeout',
        message: 'Generation is taking longer than expected. Please try again.',
      });
    }
  }, [jobStatus, jobError, pageState, refetchQuota]);

  // Handle form submission
  const handleSubmit = async () => {
    // Validate requirements
    const error = validateRequirements(requirements);
    if (error) {
      setRequirementsError(error);
      return;
    }
    setRequirementsError(null);

    // Check quota
    if (isQuotaExceeded) {
      setPageState({
        status: 'error',
        errorType: 'quota',
        message: 'Monthly generation limit reached. Please upgrade your plan or wait until next month.',
      });
      return;
    }

    // Check user data
    if (!userData?.team?.id || !userData?.organization?.id) {
      setPageState({
        status: 'error',
        errorType: 'validation',
        message: 'Unable to determine team. Please refresh and try again.',
      });
      return;
    }

    // Start generation
    setPageState({ status: 'submitting' });

    try {
      const response = await generateMutation.mutateAsync({
        team_id: userData.team.id,
        organization_id: userData.organization.id,
        requirements,
        material_ids: selectedMaterialIds.length > 0 ? selectedMaterialIds : undefined,
      });

      setPageState({
        status: 'polling',
        jobId: response.job_id,
        startTime: Date.now(),
      });
    } catch (err) {
      setPageState({
        status: 'error',
        errorType: 'network',
        message: err instanceof Error ? err.message : 'Failed to start generation.',
      });
    }
  };

  // Handle saving an activity
  const handleSaveActivity = async (activityId: string) => {
    await saveActivityMutation.mutateAsync({
      activityId,
      status: 'saved',
    });
    setSavedActivityIds((prev) => new Set(prev).add(activityId));
  };

  // Handle retry
  const handleRetry = () => {
    setPageState({ status: 'idle' });
    generateMutation.reset();
  };

  // Handle generate more (reset to idle)
  const handleGenerateMore = () => {
    setRequirements('');
    setSelectedMaterialIds([]);
    setSavedActivityIds(new Set());
    setPageState({ status: 'idle' });
    generateMutation.reset();
  };

  // Render content based on page state
  const renderContent = () => {
    switch (pageState.status) {
      case 'idle':
      case 'submitting':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate Custom Activities
              </CardTitle>
              <CardDescription>
                Describe your team's needs and our AI will create 3 unique, tailored activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quota display */}
              <div className="text-sm text-muted-foreground">
                {customUsed} / {customLimit} custom generations used this month
              </div>

              {isQuotaExceeded && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Limit Reached</AlertTitle>
                  <AlertDescription>
                    You've used all your custom generations for this month.
                  </AlertDescription>
                </Alert>
              )}

              {/* Requirements section */}
              <RequirementsSection
                value={requirements}
                onChange={setRequirements}
                disabled={pageState.status === 'submitting' || isQuotaExceeded}
                error={requirementsError ?? undefined}
              />

              {/* Materials section */}
              {userData?.team?.id && (
                <MaterialsSection
                  teamId={userData.team.id}
                  selectedIds={selectedMaterialIds}
                  onSelectionChange={setSelectedMaterialIds}
                  disabled={pageState.status === 'submitting' || isQuotaExceeded}
                />
              )}

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={
                  pageState.status === 'submitting' ||
                  isQuotaExceeded ||
                  quotaLoading ||
                  !userData?.team?.id
                }
                className="w-full"
                size="lg"
              >
                {pageState.status === 'submitting' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Starting Generation...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Activities
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );

      case 'polling':
        return (
          <Card>
            <CardContent className="pt-6">
              <GenerationProgress
                status={jobStatus?.status === 'pending' ? 'pending' : 'processing'}
                startTime={pageState.startTime}
              />
            </CardContent>
          </Card>
        );

      case 'completed':
        return (
          <Card>
            <CardContent className="pt-6">
              <GenerationResults
                activities={pageState.activities}
                onSaveActivity={handleSaveActivity}
                onGenerateMore={handleGenerateMore}
                savedActivityIds={savedActivityIds}
              />
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card>
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {pageState.errorType === 'timeout' && 'Generation Timeout'}
                  {pageState.errorType === 'failed' && 'Generation Failed'}
                  {pageState.errorType === 'network' && 'Network Error'}
                  {pageState.errorType === 'quota' && 'Limit Reached'}
                  {pageState.errorType === 'validation' && 'Validation Error'}
                </AlertTitle>
                <AlertDescription>{pageState.message}</AlertDescription>
              </Alert>
              <div className="mt-4 flex justify-center">
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">Custom Activity Generator</h1>
            <p className="text-muted-foreground">
              Create unique team-building activities tailored to your specific needs
            </p>
          </div>

          {renderContent()}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
