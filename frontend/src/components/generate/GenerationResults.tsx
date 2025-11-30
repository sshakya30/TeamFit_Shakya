/**
 * GenerationResults component
 * Displays generated activities with success celebration and save tracking
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { GeneratedActivityCard } from './GeneratedActivityCard';
import type { GenerationResultsProps } from '@/types';

/**
 * GenerationResults component
 * Shows success celebration, activity cards grid, and generate more button
 */
export function GenerationResults({
  activities,
  onSaveActivity,
  onGenerateMore,
  savedActivityIds,
}: GenerationResultsProps) {
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const handleSave = async (activityId: string) => {
    setSavingIds((prev) => new Set(prev).add(activityId));
    try {
      await onSaveActivity(activityId);
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(activityId);
        return next;
      });
    }
  };

  const savedCount = savedActivityIds.size;
  const totalCount = activities.length;

  return (
    <div className="space-y-6">
      {/* Success celebration */}
      <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Activities Generated!</h2>
        <p className="text-muted-foreground">
          {totalCount} custom activities are ready for review.
          {savedCount > 0 && (
            <span className="block mt-1 text-sm">
              {savedCount} of {totalCount} saved to your team library.
            </span>
          )}
        </p>
      </div>

      {/* Activity cards grid */}
      <div className="grid gap-4">
        {activities.map((activity) => (
          <GeneratedActivityCard
            key={activity.id}
            activity={activity}
            onSave={() => handleSave(activity.id)}
            isSaving={savingIds.has(activity.id)}
            isSaved={savedActivityIds.has(activity.id)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button onClick={onGenerateMore} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate More Activities
        </Button>
        {savedCount === totalCount && (
          <Button variant="secondary" className="gap-2" disabled>
            <Sparkles className="h-4 w-4" />
            All Activities Saved
          </Button>
        )}
      </div>

      {/* Warning if fewer than 3 activities */}
      {totalCount < 3 && (
        <p className="text-center text-sm text-amber-500">
          Note: Only {totalCount} of 3 activities were generated. Try again with different requirements for more results.
        </p>
      )}
    </div>
  );
}
