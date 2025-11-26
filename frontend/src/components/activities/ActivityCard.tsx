/**
 * Activity card component for displaying activity in grid
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, COMPLEXITY_LABELS } from '@/types';
import type { PublicActivity } from '@/hooks/useActivities';

interface ActivityCardProps {
  activity: PublicActivity;
  onViewDetails: (activity: PublicActivity) => void;
}

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
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

export function ActivityCard({ activity, onViewDetails }: ActivityCardProps) {
  const navigate = useNavigate();

  const handleCustomize = () => {
    navigate(`/customize/${activity.id}`);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">{activity.title}</CardTitle>
        </div>
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
      </CardHeader>
      <CardContent className="flex-grow pb-3">
        <p className="text-sm text-muted-foreground">
          {truncateText(activity.description, 100)}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(activity)}>
          View Details
        </Button>
        <Button size="sm" className="flex-1" onClick={handleCustomize}>
          Customize
        </Button>
      </CardFooter>
    </Card>
  );
}
