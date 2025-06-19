
import React from 'react';
import { Brain, Zap, Database, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export interface LearningActivity {
  id: string;
  timestamp: Date;
  type: 'analysis' | 'gap_detection' | 'seed_generation' | 'injection';
  description: string;
  status: 'running' | 'completed' | 'failed';
}

interface ActivityItemProps {
  activity: LearningActivity;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = (type: LearningActivity['type']) => {
    switch (type) {
      case 'analysis': return <Brain className="w-4 h-4" />;
      case 'gap_detection': return <AlertCircle className="w-4 h-4" />;
      case 'seed_generation': return <Zap className="w-4 h-4" />;
      case 'injection': return <Database className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: LearningActivity['status']) => {
    switch (status) {
      case 'running': return <Clock className="w-3 h-3 animate-spin text-blue-600" />;
      case 'completed': return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'failed': return <AlertCircle className="w-3 h-3 text-red-600" />;
    }
  };

  return (
    <div className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        {getActivityIcon(activity.type)}
        {getStatusIcon(activity.status)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 break-words">{activity.description}</p>
        <p className="text-gray-500 text-xs">
          {activity.timestamp.toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
};

export default ActivityItem;
