
import React from 'react';
import ActivityItem, { LearningActivity } from './ActivityItem';

interface ActivityListProps {
  activities: LearningActivity[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  if (activities.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Recente Activiteiten</h4>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
};

export default ActivityList;
