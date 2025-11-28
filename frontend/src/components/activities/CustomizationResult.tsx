/**
 * CustomizationResult component for displaying AI customization results
 * Shows the customized activity with save/discard options
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle2,
  Save,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import type { CustomizationResultProps } from '@/types';

export function CustomizationResult({
  activity,
  quotas,
  onSave,
  onDiscard,
  isSaving,
}: CustomizationResultProps) {
  return (
    <div className="space-y-6">
      {/* Success header */}
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Customization complete!</span>
      </div>

      {/* Activity details */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{activity.title}</h3>
          {activity.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {activity.description}
            </p>
          )}
        </div>

        {/* Instructions */}
        {activity.instructions && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Instructions:</p>
            <p className="text-sm whitespace-pre-wrap">{activity.instructions}</p>
          </div>
        )}

        {/* Customization notes */}
        {activity.customization_notes && (
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium mb-2">Customization Notes:</p>
            <p className="text-sm text-muted-foreground">
              {activity.customization_notes}
            </p>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {activity.duration_minutes && (
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              {activity.duration_minutes} min
            </Badge>
          )}
          {activity.complexity && (
            <Badge variant="outline">{activity.complexity}</Badge>
          )}
          {activity.category && (
            <Badge variant="outline">{activity.category}</Badge>
          )}
        </div>

        {/* Required tools */}
        {activity.required_tools && activity.required_tools.length > 0 && (
          <div className="text-sm">
            <span className="font-medium">Required tools: </span>
            <span className="text-muted-foreground">
              {activity.required_tools.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Quota info */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          Customizations used: {quotas.public_used} / {quotas.public_limit} this month
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onDiscard}
          variant="outline"
          className="flex-1"
          disabled={isSaving}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>
        <Button
          onClick={onSave}
          className="flex-1"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save to My Activities
            </>
          )}
        </Button>
      </div>

      {/* Expiration notice */}
      <p className="text-xs text-center text-muted-foreground">
        This activity will expire in 30 days if not scheduled.
      </p>
    </div>
  );
}
