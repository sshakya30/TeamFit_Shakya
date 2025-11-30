/**
 * GeneratedActivityCard component
 * Displays a single generated activity with save functionality
 */

import { Clock, BarChart3, Wrench, Check, Loader2, BookmarkPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { COMPLEXITY_LABELS, CATEGORY_LABELS } from '@/types';
import type { GeneratedActivityCardProps } from '@/types';

/**
 * GeneratedActivityCard component
 * Shows activity details with title, description, duration, complexity, tools, and instructions
 */
export function GeneratedActivityCard({
  activity,
  onSave,
  isSaving = false,
  isSaved = false,
}: GeneratedActivityCardProps) {
  const complexityLabel = activity.complexity
    ? COMPLEXITY_LABELS[activity.complexity] || activity.complexity
    : null;

  const categoryLabel = activity.category
    ? CATEGORY_LABELS[activity.category] || activity.category
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{activity.title}</CardTitle>
            {categoryLabel && (
              <Badge variant="secondary" className="mt-2">
                {categoryLabel}
              </Badge>
            )}
          </div>
          <Button
            onClick={onSave}
            disabled={isSaving || isSaved}
            size="sm"
            variant={isSaved ? 'secondary' : 'default'}
            className="shrink-0"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <BookmarkPlus className="mr-1 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {activity.description && (
          <p className="text-sm text-muted-foreground">{activity.description}</p>
        )}

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2">
          {activity.duration_minutes && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {activity.duration_minutes} min
            </Badge>
          )}
          {complexityLabel && (
            <Badge variant="outline" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {complexityLabel}
            </Badge>
          )}
        </div>

        {/* Required tools */}
        {activity.required_tools && activity.required_tools.length > 0 && (
          <div>
            <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
              <Wrench className="h-4 w-4" />
              Required Tools
            </h4>
            <div className="flex flex-wrap gap-1">
              {activity.required_tools.map((tool, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {activity.instructions && (
          <div>
            <h4 className="text-sm font-medium mb-2">Instructions</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3">
              {activity.instructions}
            </div>
          </div>
        )}

        {/* Customization notes */}
        {activity.customization_notes && (
          <div className="text-xs text-muted-foreground italic border-t pt-3">
            <strong>AI Notes:</strong> {activity.customization_notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
