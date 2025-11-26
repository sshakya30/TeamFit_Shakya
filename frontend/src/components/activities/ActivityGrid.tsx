/**
 * Responsive grid layout for activity cards
 * 1 column on mobile, 2 on tablet, 3 on desktop
 */

import { ActivityCard } from './ActivityCard';
import type { PublicActivity } from '@/hooks/useActivities';

interface ActivityGridProps {
  activities: PublicActivity[];
  onViewDetails: (activity: PublicActivity) => void;
}

export function ActivityGrid({ activities, onViewDetails }: ActivityGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
