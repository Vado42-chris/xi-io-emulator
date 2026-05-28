import React, { useRef, useEffect } from 'react';
import type { GameRecord } from '../data/gameModels';

interface GameTileProps {
  game: GameRecord;
  isFocused: boolean;
  onClick: () => void;
}

// Simple color generator helper based on systemId / title hash for visually rich cards
const getGradientStyle = (systemId: string, title: string) => {
  const normalizedSystem = systemId.toLowerCase();
  if (normalizedSystem.includes('snes') || normalizedSystem.includes('nintendo')) {
    return {
      background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', // SNES Indigo/Deep Purple
      color: '#a5b4fc',
    };
  }
  if (normalizedSystem.includes('genesis') || normalizedSystem.includes('sega')) {
    return {
      background: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)', // Genesis Blue/Sky Blue
      color: '#7dd3fc',
    };
  }
  if (normalizedSystem.includes('nes')) {
    return {
      background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)', // Retro Red
      color: '#fca5a5',
    };
  }
  
  // Hash title for a stable pseudo-random gradient
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue1}, 70%, 45%) 0%, hsl(${hue2}, 80%, 20%) 100%)`,
    color: `hsl(${hue1}, 80%, 80%)`,
  };
};

export const GameTile: React.FC<GameTileProps> = ({ game, isFocused, onClick }) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const gradient = getGradientStyle(game.systemId, game.title);

  // Scroll into view if focused
  useEffect(() => {
    if (isFocused && tileRef.current) {
      tileRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [isFocused]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ready':
        return 'game-tile-status-indicator ready';
      case 'blocked':
        return 'game-tile-status-indicator blocked';
      default:
        return 'game-tile-status-indicator not-configured';
    }
  };

  const getInitials = (title: string) => {
    return title
      .split(/[\s-_]+/)
      .filter((w) => w.length > 0)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div
      ref={tileRef}
      className={`game-tile ${isFocused ? 'focused' : ''}`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`${game.title} on ${game.systemId}`}
    >
      <div className="game-tile-art">
        <div className="game-tile-art-gradient" style={{ background: gradient.background }} />
        <span className="game-tile-art-text" style={{ color: gradient.color + '20' }}>
          {getInitials(game.title)}
        </span>
      </div>

      <div className="game-tile-overlay">
        <span className="game-tile-title">{game.title}</span>
        <div className="game-tile-row">
          <span className="game-tile-system">{game.systemId}</span>
          <div 
            className={getStatusClass(game.launchStatus)} 
            title={`Status: ${game.launchStatus}`} 
          />
        </div>
      </div>
    </div>
  );
};
