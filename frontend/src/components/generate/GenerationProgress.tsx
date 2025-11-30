/**
 * Progress indicator for custom activity generation
 * Shows animated spinner, elapsed time, and status message
 */

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { GenerationProgressProps } from '@/types';

/**
 * GenerationProgress component
 * Displays progress indicator during activity generation
 */
export function GenerationProgress({
  status,
  startTime,
}: GenerationProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Estimate progress based on typical generation time (60 seconds)
  const estimatedProgress = Math.min((elapsed / 60) * 100, 95);

  const statusMessage =
    status === 'pending'
      ? 'Preparing your request...'
      : 'Generating custom activities...';

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-muted flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">{statusMessage}</h3>
        <p className="text-sm text-muted-foreground">
          This usually takes 30-60 seconds. Please wait...
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <Progress value={estimatedProgress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Elapsed: {formatTime(elapsed)}</span>
          <span>
            {status === 'pending' ? 'Queued' : 'Processing with AI'}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-sm">
        Our AI is crafting 3 unique activities tailored to your team's needs.
        Each activity includes detailed instructions and materials.
      </p>
    </div>
  );
}
