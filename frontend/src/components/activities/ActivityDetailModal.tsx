/**
 * Activity detail modal component
 * Displays full activity information with customization option
 */

import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, COMPLEXITY_LABELS } from '@/types';
import type { PublicActivity } from '@/hooks/useActivities';

interface ActivityDetailModalProps {
  activity: PublicActivity | null;
  open: boolean;
  onClose: () => void;
}

function getComplexityColor(complexity: string | null): string {
  switch (complexity) {
    case 'easy':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'hard':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    default:
      return '';
  }
}

export function ActivityDetailModal({ activity, open, onClose }: ActivityDetailModalProps) {
  const navigate = useNavigate();

  if (!activity) return null;

  const handleCustomize = () => {
    onClose();
    navigate(`/customize/${activity.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{activity.title}</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">
                {CATEGORY_LABELS[activity.category] || activity.category}
              </Badge>
              {activity.duration_minutes && (
                <Badge variant="secondary">{activity.duration_minutes} min</Badge>
              )}
              {activity.complexity && (
                <Badge className={getComplexityColor(activity.complexity)}>
                  {COMPLEXITY_LABELS[activity.complexity] || activity.complexity}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description */}
          {activity.description && (
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
            </div>
          )}

          {/* Instructions */}
          {activity.instructions && (
            <div>
              <h4 className="font-semibold mb-2">Instructions</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {activity.instructions}
              </p>
            </div>
          )}

          {/* Required Tools */}
          {activity.required_tools && activity.required_tools.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Required Tools</h4>
              <div className="flex flex-wrap gap-2">
                {activity.required_tools.map((tool, index) => (
                  <Badge key={index} variant="secondary">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          <Button onClick={handleCustomize} className="w-full sm:w-auto">
            Customize for My Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
