import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Gamepad, 
  Settings, 
  FolderPlus, 
  Search, 
  Play, 
  Heart, 
  FolderOpen, 
  AlertTriangle,
  X
} from 'lucide-react';
import type { GameRecord } from '../data/gameModels';
import type { ProjectStatus } from '../data/projectStatus';
import type { LibraryRoot } from '../services/db';
import { getProofLaunchGames } from '../services/proofGameService';
import { GameTile } from './GameTile';
import { detectDuplicateCandidates } from '../services/searchService';
import { checkLaunchReadiness, launchGame, getDemoMode, simulateLaunchGame } from '../services/launchService';
import type { LaunchBlocker, LaunchResult } from '../services/launchService';

interface ArcadeHomeProps {
  games: GameRecord[];
  status: ProjectStatus;
  roots: LibraryRoot[];
  demoMode?: boolean;
  onToggleAdminMode: () => void;
  onQuickSingleIngress: () => void;
  onQuickBatchIngress: () => void;
  onToggleFavorite: (game: GameRecord) => void;
  onLaunchComplete?: () => void;
}

export const ArcadeHome: React.FC<ArcadeHomeProps> = ({
  games,
  status,
  onToggleAdminMode,
  onQuickSingleIngress,
  onQuickBatchIngress,
  onToggleFavorite,
  onLaunchComplete,
  demoMode: demoModeProp,
}) => {
  const [activeShelfIndex, setActiveShelfIndex] = useState(0);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Launch state
  const [launchingGame, setLaunchingGame] = useState<GameRecord | null>(null);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
  const [launchBlockers, setLaunchBlockers] = useState<LaunchBlocker[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeBlocker, setActiveBlocker] = useState<LaunchBlocker | null>(null);

  const demoMode = demoModeProp ?? getDemoMode();

  const handleLaunchGame = useCallback(async (game: GameRecord) => {
    const readiness = await checkLaunchReadiness(game);
    setLaunchBlockers(readiness.blockers);
    setLaunchingGame(game);

    if (!readiness.ready) {
      setLaunchResult({ success: false, command: '', error: readiness.blockers[0]?.desc });
      return;
    }

    setIsLaunching(true);
    try {
      const result = demoMode ? simulateLaunchGame(game) : await launchGame(game);
      setLaunchResult(result);
      onLaunchComplete?.();
    } finally {
      setIsLaunching(false);
    }
  }, [demoMode, onLaunchComplete]);

  // Return to Arcade Home automatically after a clean emulator exit.
  useEffect(() => {
    if (!launchingGame || isLaunching || !launchResult?.returnedCleanly) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLaunchingGame(null);
      setLaunchResult(null);
      setLaunchBlockers([]);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [launchingGame, isLaunching, launchResult]);

  // Memoize all shelf derivations to avoid re-renders and fix hook dependencies
  const { shelves, allGames, proofLaunchGames } = useMemo(() => {
    const activeGames = games.filter((g) => !g.hidden);
    const proofLaunchGames = !demoMode ? getProofLaunchGames(activeGames) : [];

    const recentlyAdded = [...activeGames]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const favorites = activeGames.filter((g) => g.favorite);
    const needsConfig = activeGames.filter((g) => g.launchStatus !== 'ready');
    const all = [...activeGames].sort((a, b) => a.title.localeCompare(b.title));

    const duplicateGroups = detectDuplicateCandidates(games);
    const duplicateGameIds = new Set(duplicateGroups.flatMap((dg) => dg.gameIds));
    const duplicates = activeGames.filter((g) => duplicateGameIds.has(g.id));

    const list: { id: string; title: string; count: number; games: GameRecord[] }[] = [];

    // #xar:controller-launch-proof/pass-b — proof shelf first so stale demo tiles are not default focus
    if (proofLaunchGames.length > 0) {
      list.push({
        id: 'passb_proof',
        title: 'Pass B Launch Proof (use these)',
        count: proofLaunchGames.length,
        games: proofLaunchGames,
      });
    }

    const proofIds = new Set(proofLaunchGames.map((g) => g.id));
    const isProofOnlyLibrary =
      proofLaunchGames.length > 0 &&
      activeGames.length === proofLaunchGames.length &&
      activeGames.every((g) => proofIds.has(g.id));

    // Pass B proof-only: avoid duplicate Recently Added / Favorites / All shelves (same 2 tiles)
    if (!isProofOnlyLibrary) {
      if (recentlyAdded.length > 0) {
        list.push({ id: 'recent', title: 'Recently Added', count: recentlyAdded.length, games: recentlyAdded });
      }
      if (favorites.length > 0) {
        list.push({ id: 'favorites', title: 'Favorites', count: favorites.length, games: favorites });
      }
      if (needsConfig.length > 0) {
        list.push({ id: 'needs_config', title: 'Needs Configuration', count: needsConfig.length, games: needsConfig });
      }
      if (all.length > 0) {
        list.push({ id: 'all', title: 'All Games', count: all.length, games: all });
      }
      if (duplicates.length > 0) {
        list.push({ id: 'duplicates', title: 'Duplicate Candidates', count: duplicates.length, games: duplicates });
      }
    }

    return { shelves: list, allGames: all, proofLaunchGames };
  }, [games, demoMode]);

  // Active focused game in the carousel
  const activeShelf = shelves[activeShelfIndex];
  const activeGame = activeShelf?.games[activeGameIndex];

  useEffect(() => {
    if (!activeGame) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveBlocker(null);
      return;
    }
    void checkLaunchReadiness(activeGame).then((readiness) => {
      setActiveBlocker(readiness.ready ? null : readiness.blockers[0] ?? null);
    });
  }, [activeGame]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle keyboard events (D-pad emulator)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Launching Overlay active: Only Esc returns
      if (launchingGame) {
        if (e.key === 'Escape') {
          setLaunchingGame(null);
        }
        return;
      }

      // 2. Search Overlay active
      if (isSearchOpen) {
        const filteredSearchGames = allGames.filter((g) =>
          g.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (e.key === 'Escape') {
          setIsSearchOpen(false);
          setSearchQuery('');
          setActiveSearchIndex(0);
          e.preventDefault();
        } else if (e.key === 'ArrowLeft') {
          setActiveSearchIndex((prev) => (prev > 0 ? prev - 1 : prev));
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          setActiveSearchIndex((prev) =>
            prev < filteredSearchGames.length - 1 ? prev + 1 : prev
          );
          e.preventDefault();
        } else if (e.key === 'Enter') {
          const selected = filteredSearchGames[activeSearchIndex];
          if (selected) {
            handleLaunchGame(selected);
            setIsSearchOpen(false);
            setSearchQuery('');
            setActiveSearchIndex(0);
          }
          e.preventDefault();
        }
        return;
      }

      // 3. Normal Carousel Navigation
      if (shelves.length === 0) return;

      switch (e.key) {
        case 'ArrowUp':
          setActiveShelfIndex((prev) => {
            const next = prev > 0 ? prev - 1 : prev;
            setActiveGameIndex(0); // Reset horizontal index
            return next;
          });
          e.preventDefault();
          break;
        case 'ArrowDown':
          setActiveShelfIndex((prev) => {
            const next = prev < shelves.length - 1 ? prev + 1 : prev;
            setActiveGameIndex(0);
            return next;
          });
          e.preventDefault();
          break;
        case 'ArrowLeft':
          setActiveGameIndex((prev) => (prev > 0 ? prev - 1 : prev));
          e.preventDefault();
          break;
        case 'ArrowRight': {
          const currentShelfGames = shelves[activeShelfIndex]?.games || [];
          setActiveGameIndex((prev) =>
            prev < currentShelfGames.length - 1 ? prev + 1 : prev
          );
          e.preventDefault();
          break;
        }
        case 'Enter':
          if (activeGame) {
            handleLaunchGame(activeGame);
          }
          e.preventDefault();
          break;
        case ' ': // Space key
        case 'x':
        case 'X':
          if (activeGame) {
            onToggleFavorite(activeGame);
          }
          e.preventDefault();
          break;
        case 'y':
        case 'Y':
          setIsSearchOpen(true);
          e.preventDefault();
          break;
        case 'Escape':
          onToggleAdminMode();
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shelves,
    activeShelfIndex,
    activeGameIndex,
    activeGame,
    isSearchOpen,
    searchQuery,
    activeSearchIndex,
    launchingGame,
    allGames,
    onToggleFavorite,
    onToggleAdminMode,
    handleLaunchGame,
  ]);

  // Onboarding Layout
  if (games.length === 0) {
    return (
      <div className="arcade-onboarding">
        <h1 className="arcade-onboarding-title">
          Welcome to <span>xi-io Arcade</span>
        </h1>
        <p className="arcade-onboarding-desc">
          A premium, 10-foot, controller-friendly home for your local retro game collection.
          Get started by importing your library or staging a single game.
        </p>

        <div className="arcade-onboarding-grid">
          <div className="arcade-onboarding-card" onClick={onQuickSingleIngress} id="btn-quick-single">
            <div className="arcade-onboarding-card-icon">
              <Gamepad size={32} />
            </div>
            <h3 className="arcade-onboarding-card-title">Stage Single Game</h3>
            <p className="arcade-onboarding-card-desc">
              Simulate importing a single SNES ROM for instant launch testing.
            </p>
          </div>

          <div className="arcade-onboarding-card" onClick={onQuickBatchIngress} id="btn-quick-batch">
            <div className="arcade-onboarding-card-icon">
              <FolderPlus size={32} />
            </div>
            <h3 className="arcade-onboarding-card-title">Scan Batch Folder</h3>
            <p className="arcade-onboarding-card-desc">
              Scan a virtual library path and ingress multiple titles at once.
            </p>
          </div>

          <div className="arcade-onboarding-card" onClick={onToggleAdminMode} id="btn-quick-admin">
            <div className="arcade-onboarding-card-icon">
              <Settings size={32} />
            </div>
            <h3 className="arcade-onboarding-card-title">Admin Dashboard</h3>
            <p className="arcade-onboarding-card-desc">
              Configure system options, mount storage paths, and view log ledger details.
            </p>
          </div>
        </div>

        <div className="arcade-onboarding-checklist">
          <div className="arcade-onboarding-check-item">
            <span
              className={`arcade-status-dot ${status.storageState === 'mounted' || status.storageState === 'configured' ? 'active' : 'inactive'}`}
            />
            <span>Storage: {status.storageState}</span>
          </div>
          <div className="arcade-onboarding-check-item">
            <span
              className={`arcade-status-dot ${status.controllerState === 'connected' ? 'active' : 'inactive'}`}
            />
            <span>Controller: {status.controllerState}</span>
          </div>
          <div className="arcade-onboarding-check-item">
            <span
              className={`arcade-status-dot ${status.launchReadiness === 'ready' ? 'active' : status.launchReadiness === 'partial' ? 'active' : 'inactive'}`}
              style={status.launchReadiness === 'partial' ? { opacity: 0.6 } : undefined}
            />
            <span>Launch Readiness: {status.launchReadiness}</span>
          </div>
        </div>

        <button
          className="arcade-admin-btn"
          onClick={onToggleAdminMode}
          style={{ marginTop: '40px' }}
        >
          <Settings size={14} /> Open Admin Console
        </button>
      </div>
    );
  }

  const blocker = activeBlocker;
  const filteredSearchGames = allGames.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="arcade-container">
      {demoMode && (
        <div
          style={{
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            borderBottom: '2px solid #fbbf24',
            color: '#fbbf24',
            padding: '10px 24px',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          DEMO MODE — launches are simulated; no emulator process is started. Disable in Admin → Settings.
        </div>
      )}
      {/* Header */}
      <header className="arcade-header">
        <div className="arcade-logo-area">
          <div className="logo-glow">X</div>
          <div className="arcade-logo">
            xi-io <span>Arcade</span>
          </div>
        </div>

        <div className="arcade-status-indicators">
          <div className="arcade-status-item">
            <span
              className={`arcade-status-dot ${status.storageState === 'mounted' || status.storageState === 'configured' ? 'active' : 'inactive'}`}
            />
            <span>Storage</span>
          </div>
          <div className="arcade-status-item">
            <span
              className={`arcade-status-dot ${status.controllerState === 'connected' ? 'active' : 'inactive'}`}
            />
            <span>Controller</span>
          </div>
          <div className="arcade-status-item">
            <span
              className={`arcade-status-dot ${status.launchReadiness === 'ready' ? 'active' : status.launchReadiness === 'partial' ? 'active' : 'inactive'}`}
              style={status.launchReadiness === 'partial' ? { opacity: 0.6 } : undefined}
            />
            <span>Engine Ready ({status.overallProofState})</span>
          </div>

          <button className="arcade-admin-btn" onClick={onToggleAdminMode} id="btn-toggle-admin">
            <Settings size={14} /> Admin Mode
          </button>
        </div>
      </header>

      {proofLaunchGames.length > 0 && !demoMode && (
        <div
          style={{
            margin: '0 24px 8px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Pass B: launch only from the <strong>Pass B Launch Proof</strong> shelf. Ignore demo/batch tiles under
          /media/arcade-usb/ — they are mock records, not your real library.
        </div>
      )}

      {/* Hero Area */}
      {activeGame && (
        <section className="arcade-hero">
          {(activeGame.mappings?.artwork?.background || activeGame.mappings?.artwork?.screenshot) ? (
            <img 
              src={activeGame.mappings.artwork.background || activeGame.mappings.artwork.screenshot} 
              alt=""
              className="arcade-hero-art-bg"
              key={activeGame.id}
            />
          ) : null}
          <div className="arcade-hero-bg" />
          <div className="arcade-hero-content">
            <div className="arcade-hero-system-badge">{activeGame.systemId}</div>
            <h1 className="arcade-hero-title">{activeGame.title}</h1>

            <div className="arcade-hero-meta">
              <div className="arcade-hero-meta-item">
                <FolderOpen size={14} />
                <span>{activeGame.ingressMode === 'single_game' ? 'Single Ingress' : 'Batch Library'}</span>
              </div>
              <div className="arcade-hero-meta-item">
                <Gamepad size={14} />
                <span>Plays: {activeGame.playCount}</span>
              </div>
              {activeGame.favorite && (
                <div className="arcade-hero-meta-item" style={{ color: '#fbbf24' }}>
                  <Heart size={14} fill="#fbbf24" />
                  <span>Favorite</span>
                </div>
              )}
            </div>

            <p className="arcade-hero-desc">
              Path: {activeGame.contentPath} ({activeGame.fileExtension.toUpperCase()} Rom File)
            </p>

            {blocker ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px', margin: '12px 0' }}>
                <div className="arcade-hero-blocker-panel" style={{ margin: 0 }}>
                  <div className="arcade-hero-blocker-title">
                    <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {blocker.title}
                  </div>
                  <div className="arcade-hero-blocker-desc">{blocker.desc}</div>
                </div>
                <button
                  className="arcade-admin-btn"
                  onClick={onToggleAdminMode}
                  style={{ alignSelf: 'flex-start', padding: '10px 16px', fontSize: '0.85rem' }}
                >
                  <Settings size={14} /> Open Admin Console to Resolve
                </button>
              </div>
            ) : (
              <div className="arcade-hero-actions">
                <button
                  className="arcade-btn-launch"
                  onClick={() => handleLaunchGame(activeGame)}
                >
                  <Play size={18} fill="#fff" /> PRESS ENTER TO PLAY
                </button>
                <button
                  className="arcade-btn-secondary"
                  onClick={() => onToggleFavorite(activeGame)}
                >
                  <Heart size={16} fill={activeGame.favorite ? '#fff' : 'none'} />
                  {activeGame.favorite ? 'Unfavorite' : 'Add to Favorites'}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Shelves List */}
      <section className="arcade-shelves-container">
        {shelves.map((shelf, shelfIdx) => (
          <div key={shelf.id} className="arcade-shelf">
            <h2 className="arcade-shelf-title">
              {shelf.title}
              <span className="arcade-shelf-title-count">({shelf.count})</span>
            </h2>
            <div className="arcade-shelf-carousel">
              {shelf.games.map((game, gameIdx) => (
                <GameTile
                  key={`${shelf.id}-${game.id}`}
                  game={game}
                  isFocused={activeShelfIndex === shelfIdx && activeGameIndex === gameIdx}
                  onClick={() => {
                    setActiveShelfIndex(shelfIdx);
                    setActiveGameIndex(gameIdx);
                    handleLaunchGame(game);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Hint Rail */}
      <footer className="arcade-hint-rail">
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-a">A</span>
          <span>Play / Select</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-x">X</span>
          <span>Favorite</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-y">Y</span>
          <span>Search Library</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-menu">Esc</span>
          <span>Admin Mode</span>
        </div>
      </footer>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="search-overlay-container">
          <button
            className="arcade-btn-secondary"
            style={{ position: 'absolute', top: '30px', right: '30px', padding: '12px' }}
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
          >
            <X size={20} />
          </button>
          
          <div className="search-overlay-input-wrap">
            <Search className="search-overlay-icon" size={28} />
            <input
              ref={searchInputRef}
              type="text"
              className="search-overlay-input"
              placeholder="Search by Title, System, or Tags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveSearchIndex(0);
              }}
            />
          </div>

          <div className="search-overlay-results">
            <h3 style={{ marginBottom: '20px', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
              Results ({filteredSearchGames.length})
            </h3>
            {filteredSearchGames.length > 0 ? (
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {filteredSearchGames.map((game, idx) => (
                  <GameTile
                    key={`search-${game.id}`}
                    game={game}
                    isFocused={activeSearchIndex === idx}
                    onClick={() => {
                      handleLaunchGame(game);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                  />
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.25rem', textAlign: 'center', marginTop: '60px' }}>
                No matching games found.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Launch / Blocker Overlay */}
      {launchingGame && (
        <div className="launch-overlay" style={{ flexDirection: 'column', padding: '40px', justifyContent: 'center' }}>
          {launchBlockers.length > 0 ? (
            <div style={{ maxWidth: '600px', width: '100%', backgroundColor: 'rgba(20, 21, 33, 0.95)', border: '1px solid var(--color-warning)', borderRadius: '12px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: 'var(--color-warning)' }}>
                <AlertTriangle size={32} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Launch Blocked: System Check Failed</h2>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '24px', lineHeight: '1.5' }}>
                We could not start <strong>{launchingGame.title}</strong> due to the following system path or volume blocker:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {launchBlockers.map((blocker, idx) => (
                  <div key={idx} style={{ backgroundColor: '#07080d', border: '1px solid var(--border-subtle)', padding: '16px', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-warning)' }}>{blocker.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{blocker.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button className="arcade-admin-btn" onClick={onToggleAdminMode} style={{ flex: 1, padding: '12px' }}>
                  Open Settings & Fix Path
                </button>
                <button className="arcade-admin-btn" onClick={() => setLaunchingGame(null)} style={{ flex: 1, padding: '12px', opacity: 0.8 }}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="launch-overlay-title">
                {isLaunching
                  ? `Launching ${launchingGame.title}...`
                  : launchResult?.returnedCleanly
                    ? `Returned from ${launchingGame.title}`
                    : launchResult?.success
                      ? `${launchingGame.title} finished`
                      : `Could not launch ${launchingGame.title}`}
              </h1>
              {isLaunching && (
                <div className="launch-overlay-spinner" style={{ margin: '24px auto' }} />
              )}
              
              {!isLaunching && launchResult?.error && !launchResult.returnedCleanly && (
                <p style={{ color: 'var(--color-warning)', maxWidth: '600px', textAlign: 'center' }}>{launchResult.error}</p>
              )}

              {!isLaunching && launchResult?.returnedCleanly && (
                <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', textAlign: 'center' }}>
                  Returning to Arcade Home...
                </p>
              )}
              
              {launchResult?.command && (
                <div style={{ maxWidth: '600px', width: '100%', margin: '20px auto', textAlign: 'left', backgroundColor: 'rgba(5, 6, 11, 0.8)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>Resolved Adapter Launch Command:</span>
                  <code style={{ color: '#60a5fa', wordBreak: 'break-all' }}>{launchResult.command}</code>
                </div>
              )}

              <p className="launch-overlay-hint">
                {isLaunching
                  ? 'Emulator is running. Quit from the emulator window to return here.'
                  : launchResult?.returnedCleanly
                    ? 'Arcade Home will restore automatically.'
                    : launchResult?.success
                      ? 'Press Escape to close this overlay.'
                      : 'Press Escape to close this overlay. If an emulator is still running, quit it from its window.'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
