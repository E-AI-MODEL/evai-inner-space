import React from 'react';
import AutonomyCockpit from './AutonomyCockpit';

const AutonomyConsole: React.FC<{ systemMetrics?: any; connectionStatus?: any }> = ({ systemMetrics, connectionStatus }) => {
  return <AutonomyCockpit systemMetrics={systemMetrics} connectionStatus={connectionStatus} />;
};

export default AutonomyConsole;
