import React from 'react';
import { Inbox, FolderOpen, FileCode, Search } from 'lucide-react';
import type { GameRecord } from '../data/gameModels';
import type { LibraryRoot } from '../services/db';
import { GameCard } from './GameCard';

interface LibraryGridProps {
  games: GameRecord[];
  libraryRoots: LibraryRoot[];
  onSelectGame: (game: GameRecord) => void;
  onToggleFavorite: (game: GameRecord) => void;
  onToggleHidden: (game: GameRecord) => void;
  onDeleteGame: (game: GameRecord) => void;
  onTriggerSingleIngress: () => void;
  onTriggerBatchIngress: () => void;
  isFiltered: boolean;
  onClearFilters?: () => void;
}

export const LibraryGrid: React.FC<LibraryGridProps> = ({
  games,
  libraryRoots,
  onSelectGame,
  onToggleFavorite,
  onToggleHidden,
  onDeleteGame,
  onTriggerSingleIngress,
  onTriggerBatchIngress,
  isFiltered,
  onClearFilters
}) => {
  // Helper to determine if a game's library root is mounted
  const getIsRootMounted = (game: GameRecord) => {
    if (game.ingressMode === 'single_game') return true;
    if (!game.libraryRootId) return true;
    const root = libraryRoots.find(r => r.id === game.libraryRootId);
    return root ? root.mounted : true;
  };

  if (games.length === 0) {
    return (
      <div className="empty-state-container">
        <div className="empty-state-card">
          {isFiltered ? (
            <>
              <Search size={48} className="empty-state-icon" style={{ color: 'var(--color-accent)' }} />
              <h3 className="empty-state-title">No matching games</h3>
              <p className="empty-state-desc">
                Adjust your filters, search terms, or status selections to find your games.
              </p>
              {onClearFilters && (
                <button 
                  className="btn-primary"
                  onClick={onClearFilters}
                  style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  Clear Filters
                </button>
              )}
            </>
          ) : (
            <>
              <Inbox size={48} className="empty-state-icon" style={{ color: 'var(--color-accent)' }} />
              <h3 className="empty-state-title">Your arcade library is empty</h3>
              <p className="empty-state-desc">
                Begin by ingressing a single ROM game file or scanning an entire directory containing your ROMs.
              </p>
              
              <div className="empty-state-actions">
                <button 
                  className="empty-state-action-btn"
                  onClick={onTriggerBatchIngress}
                >
                  <FolderOpen size={20} />
                  <div>
                    <div className="action-btn-title">Scan Library Folder</div>
                    <div className="action-btn-subtitle">Batch ingress files from directories</div>
                  </div>
                </button>

                <button 
                  className="empty-state-action-btn"
                  onClick={onTriggerSingleIngress}
                >
                  <FileCode size={20} />
                  <div>
                    <div className="action-btn-title">Ingress Single ROM</div>
                    <div className="action-btn-subtitle">Register a single SNES game file</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="games-grid">
      {games.map(game => (
        <GameCard
          key={game.id}
          game={game}
          isRootMounted={getIsRootMounted(game)}
          onToggleFavorite={onToggleFavorite}
          onToggleHidden={onToggleHidden}
          onDelete={onDeleteGame}
          onSelect={onSelectGame}
        />
      ))}
    </div>
  );
};
