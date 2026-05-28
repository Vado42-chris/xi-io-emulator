import React from 'react';
import { Shield, HardDrive, Gamepad, Zap, Milestone } from 'lucide-react';
import type { ProjectStatus } from '../data/projectStatus';

interface StatusPanelProps {
  status: ProjectStatus;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ status }) => {
  const getBadgeClass = (state: string) => {
    if (state === 'not configured') return 'badge not-configured';
    if (state === 'ready' || state === 'mounted' || state === 'connected') return 'badge ready';
    return 'badge not-configured';
  };

  return (
    <aside className="status-panel">
      <div>
        <h2 className="panel-section-title">Active System</h2>
        <div className="system-banner">
          <div className="system-icon-wrapper">
            <Gamepad size={24} />
          </div>
          <div className="system-details">
            <span className="system-name">{status.currentSystem}</span>
            <span className="system-target">Target: {status.currentBackendTarget}</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="panel-section-title">Milestone Status</h2>
        <div className="status-card">
          <div className="status-row">
            <span className="status-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Milestone size={14} /> ID
              </span>
            </span>
            <span className="status-value">{status.currentMilestone}</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="panel-section-title">Integration States</h2>
        <div className="status-card" style={{ gap: '16px' }}>
          <div className="status-row">
            <span className="status-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={14} /> Storage
              </span>
            </span>
            <span className={getBadgeClass(status.storageState)}>
              {status.storageState}
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Gamepad size={14} /> Controller
              </span>
            </span>
            <span className={getBadgeClass(status.controllerState)}>
              {status.controllerState}
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> Launch Readiness
              </span>
            </span>
            <span className={getBadgeClass(status.launchReadiness)}>
              {status.launchReadiness}
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div className="status-card" style={{ borderStyle: 'dashed', opacity: 0.7 }}>
          <div className="status-row" style={{ justifyContent: 'center', gap: '8px' }}>
            <Shield size={14} />
            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Local-First Environment</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
