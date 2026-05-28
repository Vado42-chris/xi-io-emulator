import React from 'react';
import { Check, AlertTriangle, Settings } from 'lucide-react';
import type { GameLaunchStatus } from '../data/gameModels';

interface ReadinessBadgeProps {
  status: GameLaunchStatus;
  blockers?: string[];
}

export const ReadinessBadge: React.FC<ReadinessBadgeProps> = ({ status, blockers = [] }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'ready':
        return {
          className: 'status-badge ready',
          icon: <Check size={12} style={{ marginRight: '4px' }} />,
          text: 'Ready',
          title: 'Game is ready to launch'
        };
      case 'blocked': {
        const blockerText = blockers.length > 0 ? blockers.join(', ') : 'Drive Offline';
        return {
          className: 'status-badge blocked',
          icon: <AlertTriangle size={12} style={{ marginRight: '4px' }} />,
          text: blockerText,
          title: `Launch Blocked: ${blockerText}`
        };
      }
      case 'not_configured':
      default:
        return {
          className: 'status-badge not-configured',
          icon: <Settings size={12} style={{ marginRight: '4px' }} />,
          text: 'Needs config',
          title: 'RetroArch or core path not configured'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span 
      className={config.className} 
      title={config.title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap'
      }}
    >
      {config.icon}
      {config.text}
    </span>
  );
};
