import React from 'react';
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { GameRecord } from '../data/gameModels';
import { ReadinessBadge } from './ReadinessBadge';
import { TagPill } from './TagPill';

interface GameCardProps {
  game: GameRecord;
  isRootMounted: boolean;
  onToggleFavorite: (game: GameRecord) => void;
  onToggleHidden: (game: GameRecord) => void;
  onDelete: (game: GameRecord) => void;
  onSelect: (game: GameRecord) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isRootMounted,
  onToggleFavorite,
  onToggleHidden,
  onDelete,
  onSelect
}) => {
  // Determine launch status based on root mount state
  // If batch_library and root is not mounted, it's blocked.
  // Otherwise, default to the game's intrinsic launchStatus (which is 'not_configured' by default)
  const currentStatus = (game.ingressMode === 'batch_library' && !isRootMounted) 
    ? 'blocked' 
    : game.launchStatus;

  const blockers = currentStatus === 'blocked' ? ['Drive Offline'] : [];

  return (
    <div 
      className="game-card" 
      onClick={() => onSelect(game)}
      style={{ 
        cursor: 'pointer',
        opacity: currentStatus === 'blocked' ? 0.65 : 1
      }}
    >
      <div>
        <div className="game-card-header">
          <h3 className="game-card-title">{game.title}</h3>
          <ReadinessBadge status={currentStatus} blockers={blockers} />
        </div>
        
        <div className="game-card-meta" style={{ marginTop: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            System: <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{game.systemId.toUpperCase()}</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Mode: <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{game.ingressMode === 'single_game' ? 'Single Game' : 'Batch Library'}</span>
          </span>
          <span style={{ fontSize: '0.7rem', color: '#64748b', wordBreak: 'break-all', marginTop: '4px' }}>
            Path: {game.contentPath}
          </span>
        </div>

        <div className="game-tags" style={{ marginTop: '12px' }}>
          {game.tags.map(tag => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      </div>

      <div className="game-card-actions" onClick={e => e.stopPropagation()}>
        <button 
          className={`icon-btn star ${game.favorite ? 'active' : ''}`} 
          onClick={() => onToggleFavorite(game)}
          title={game.favorite ? 'Remove from favorites' : 'Mark as favorite'}
        >
          <Star size={16} fill={game.favorite ? '#fbbf24' : 'none'} />
        </button>
        
        <button 
          className={`icon-btn hide ${game.hidden ? 'active' : ''}`} 
          onClick={() => onToggleHidden(game)}
          title={game.hidden ? 'Restore to catalog' : 'Hide from catalog'}
        >
          {game.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>

        <button 
          className="icon-btn delete" 
          onClick={() => onDelete(game)}
          title="Delete game record"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
