import React from 'react';
import { SimpleXAIDashboard } from './SimpleXAIDashboard';

const AutonomyConsole: React.FC<{ systemMetrics?: any; connectionStatus?: any }> = ({ systemMetrics, connectionStatus }) => {
  return <SimpleXAIDashboard />;
};

export default AutonomyConsole;
