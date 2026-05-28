import React from 'react';
import { Library, Gamepad2, FolderOpen, Cpu, Settings, Terminal } from 'lucide-react';

export type ActiveTab = 'library' | 'controllers' | 'storage' | 'engines' | 'settings' | 'logs';

interface NavigationRailProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onToggleArcadeMode?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({ 
  activeTab, 
  onTabChange,
  onToggleArcadeMode 
}) => {
  const items: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'library', label: 'Library', icon: <Library /> },
    { id: 'controllers', label: 'Controllers', icon: <Gamepad2 /> },
    { id: 'storage', label: 'Storage', icon: <FolderOpen /> },
    { id: 'engines', label: 'Engines', icon: <Cpu /> },
    { id: 'settings', label: 'Settings', icon: <Settings /> },
    { id: 'logs', label: 'Logs', icon: <Terminal /> },
  ];

  return (
    <nav className="nav-rail">
      <div className="logo-container">
        <div className="logo-glow" title="xi-io Xibalba">X</div>
      </div>
      <div className="nav-items">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-button ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onTabChange(item.id)}
            title={item.label}
          >
            {item.icon}
            <span>{item.id === 'engines' ? 'Engines' : item.label}</span>
          </button>
        ))}
      </div>
      {onToggleArcadeMode && (
        <button
          className="nav-button"
          onClick={onToggleArcadeMode}
          title="Switch to Arcade Mode"
          style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', width: '100%' }}
        >
          <Gamepad2 className="color-accent" />
          <span className="color-accent" style={{ fontWeight: 600 }}>Arcade Home</span>
        </button>
      )}
    </nav>
  );
};
