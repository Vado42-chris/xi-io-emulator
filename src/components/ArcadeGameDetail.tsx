import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Play,
  Heart,
  Gamepad,
  FolderOpen,
  Tag,
  AlertTriangle,
  StickyNote,
  Settings,
} from 'lucide-react';
import type { GameRecord } from '../data/gameModels';
import { TagPill } from './TagPill';
import { ShellGamepadHintRail } from './ShellGamepadHintRail';
import { useArcadeGamepadListener } from '../hooks/useArcadeGamepadListener';
import { getGameNotes, saveGameNotes } from '../services/gameNotesService';
import {
  formatEngineStatusSummary,
  formatEngineStatusTitle,
  getSystemEngineStatus,
  type SystemEngineStatus,
} from '../services/engineReadinessService';
import { checkLaunchReadiness, type LaunchReadiness } from '../services/launchService';
import { platformLabel } from '../services/arcadeCatalogService';
import { getSimilarGames } from '../services/recommendationService';
import { GameRecommendations } from './GameRecommendations';

interface ArcadeGameDetailProps {
  game: GameRecord;
  libraryGames: GameRecord[];
  onClose: () => void;
  onSelectGame: (game: GameRecord) => void;
  onLaunch: (game: GameRecord) => void;
  onToggleFavorite: (game: GameRecord) => void;
  onOpenAdmin: () => void;
}

type DetailAction = 'launch' | 'favorite' | 'admin';

const DETAIL_ACTIONS: DetailAction[] = ['launch', 'favorite', 'admin'];

export const ArcadeGameDetail: React.FC<ArcadeGameDetailProps> = ({
  game,
  libraryGames,
  onClose,
  onSelectGame,
  onLaunch,
  onToggleFavorite,
  onOpenAdmin,
}) => {
  const [notes, setNotes] = useState(() => getGameNotes(game.id));
  const [engineStatus, setEngineStatus] = useState<SystemEngineStatus | null>(null);
  const [readiness, setReadiness] = useState<LaunchReadiness>({ ready: false, blockers: [] });
  const [actionIndex, setActionIndex] = useState(0);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotes(getGameNotes(game.id));
    setActionIndex(0);
    void getSystemEngineStatus(game.systemId, game.contentPath).then(setEngineStatus);
    void checkLaunchReadiness(game).then(setReadiness);
  }, [game]);

  const similarGames = useMemo(
    () => getSimilarGames(game, libraryGames, 6),
    [game, libraryGames],
  );

  const persistNotes = useCallback(() => {
    saveGameNotes(game.id, notes);
  }, [game.id, notes]);

  const notesFocused = useCallback(
    () => document.activeElement === notesRef.current,
    [],
  );

  const cycleAction = useCallback((delta: number) => {
    setActionIndex((prev) => (prev + delta + DETAIL_ACTIONS.length) % DETAIL_ACTIONS.length);
  }, []);

  const executeAction = useCallback(() => {
    const action = DETAIL_ACTIONS[actionIndex];
    if (action === 'launch') {
      if (readiness.ready) {
        onLaunch(game);
      }
      return;
    }
    if (action === 'favorite') {
      onToggleFavorite(game);
      return;
    }
    onOpenAdmin();
  }, [actionIndex, game, onLaunch, onOpenAdmin, onToggleFavorite, readiness.ready]);

  const handleBack = useCallback(() => {
    if (notesFocused()) {
      notesRef.current?.blur();
      persistNotes();
      return;
    }
    persistNotes();
    onClose();
  }, [notesFocused, onClose, persistNotes]);

  const focusNotes = useCallback(() => {
    notesRef.current?.focus();
  }, []);

  useArcadeGamepadListener(true, {
    onLeft: () => {
      if (!notesFocused()) {
        cycleAction(-1);
      }
    },
    onRight: () => {
      if (!notesFocused()) {
        cycleAction(1);
      }
    },
    onUp: () => {
      overlayRef.current?.scrollBy({ top: -80, behavior: 'smooth' });
    },
    onDown: () => {
      overlayRef.current?.scrollBy({ top: 80, behavior: 'smooth' });
    },
    onConfirm: () => {
      if (notesFocused()) {
        return;
      }
      executeAction();
    },
    onBack: handleBack,
    onFavorite: () => onToggleFavorite(game),
    onSearch: focusNotes,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (notesFocused() && !['Escape', 'Enter', 'b', 'B'].includes(e.key)) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          cycleAction(-1);
          e.preventDefault();
          break;
        case 'ArrowRight':
          cycleAction(1);
          e.preventDefault();
          break;
        case 'ArrowUp':
          overlayRef.current?.scrollBy({ top: -80, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'ArrowDown':
          overlayRef.current?.scrollBy({ top: 80, behavior: 'smooth' });
          e.preventDefault();
          break;
        case 'Enter':
          if (!notesFocused()) {
            executeAction();
            e.preventDefault();
          }
          break;
        case 'Escape':
        case 'b':
        case 'B':
          handleBack();
          e.preventDefault();
          break;
        case 'x':
        case 'X':
          onToggleFavorite(game);
          e.preventDefault();
          break;
        case 'y':
        case 'Y':
          focusNotes();
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleAction, executeAction, focusNotes, handleBack, notesFocused, onToggleFavorite, game]);

  const actionClass = (action: DetailAction, base: string) =>
    `${base} ${DETAIL_ACTIONS[actionIndex] === action ? 'arcade-detail-action--focused' : ''}`;

  return (
    <div
      ref={overlayRef}
      className="arcade-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${game.title} details`}
    >
      <button type="button" className="arcade-detail-close" onClick={handleBack} aria-label="Close details">
        <X size={22} />
      </button>

      <div className="arcade-detail-layout">
        <aside className="arcade-detail-art">
          {game.mappings?.artwork?.boxart ? (
            <img src={game.mappings.artwork.boxart} alt="" className="arcade-detail-art-image" />
          ) : (
            <div className="arcade-detail-art-fallback">{game.title.slice(0, 2).toUpperCase()}</div>
          )}
        </aside>

        <div className="arcade-detail-main">
          <div className="arcade-detail-header">
            <span className="arcade-hero-system-badge">{platformLabel(game.systemId)}</span>
            <h1>{game.title}</h1>
            <p className="arcade-detail-subtitle">{game.originalFileName}</p>
          </div>

          <div className="arcade-detail-meta-grid">
            <div className="arcade-detail-meta-item">
              <FolderOpen size={16} />
              <span>{game.ingressMode === 'single_game' ? 'Single ingress' : 'Batch library'}</span>
            </div>
            <div className="arcade-detail-meta-item">
              <Gamepad size={16} />
              <span>Plays: {game.playCount}</span>
            </div>
            {game.lastPlayedAt && (
              <div className="arcade-detail-meta-item">
                <Play size={16} />
                <span>Last played {new Date(game.lastPlayedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="arcade-detail-meta-item">
              <Tag size={16} />
              <span>{game.launchStatus.replace('_', ' ')}</span>
            </div>
          </div>

          {game.tags.length > 0 && (
            <div className="arcade-detail-tags">
              {game.tags.filter(Boolean).map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
          )}

          <div className="arcade-detail-path">
            <strong>Content path</strong>
            <code>{game.contentPath}</code>
          </div>

          {engineStatus && (
            <div
              className={`arcade-detail-engine ${engineStatus.ready ? 'arcade-detail-engine--ready' : 'arcade-detail-engine--missing'}`}
            >
              <AlertTriangle size={16} />
              <div>
                <strong>{formatEngineStatusTitle(engineStatus)}</strong>
                <p>{formatEngineStatusSummary(engineStatus)}</p>
                {!engineStatus.ready && (
                  <button type="button" className="arcade-inline-link" onClick={onOpenAdmin}>
                    {engineStatus.adminHint}
                  </button>
                )}
              </div>
            </div>
          )}

          {!readiness.ready && readiness.blockers.length > 0 && (
            <ul className="arcade-detail-blockers">
              {readiness.blockers.map((blocker) => (
                <li key={`${blocker.code}-${blocker.title}`}>
                  <strong>{blocker.title}</strong>
                  <span>{blocker.desc}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="arcade-detail-notes">
            <label htmlFor="arcade-game-notes">
              <StickyNote size={16} /> Your notes
            </label>
            <textarea
              ref={notesRef}
              id="arcade-game-notes"
              className="arcade-detail-notes-input"
              placeholder="Personal notes about this game — tips, memories, where you left off…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={persistNotes}
              rows={4}
            />
          </div>

          <GameRecommendations
            title="If you like this game"
            recommendations={similarGames}
            onSelectGame={onSelectGame}
          />

          <div className="arcade-detail-actions">
            <button
              type="button"
              className={actionClass('launch', 'arcade-btn-launch')}
              onClick={() => readiness.ready && onLaunch(game)}
              disabled={!readiness.ready}
            >
              <Play size={18} fill="#fff" /> Launch game
            </button>
            <button
              type="button"
              className={actionClass('favorite', 'arcade-btn-secondary')}
              onClick={() => onToggleFavorite(game)}
            >
              <Heart size={16} fill={game.favorite ? '#fff' : 'none'} />
              {game.favorite ? 'Unfavorite' : 'Favorite'}
            </button>
            <button
              type="button"
              className={actionClass('admin', 'arcade-admin-btn')}
              onClick={onOpenAdmin}
            >
              <Settings size={14} /> Admin
            </button>
          </div>
        </div>
      </div>

      <ShellGamepadHintRail
        hints={[
          { button: 'A', label: 'Confirm action', tone: 'confirm' },
          { button: 'B', label: 'Back to library', tone: 'back' },
          { button: 'X', label: 'Favorite', tone: 'neutral' },
          { button: 'Y', label: 'Edit notes', tone: 'neutral' },
          { button: '← →', label: 'Switch action', tone: 'neutral' },
        ]}
      />
    </div>
  );
};
