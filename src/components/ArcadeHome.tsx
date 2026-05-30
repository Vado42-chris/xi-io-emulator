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
  Info,
  X
} from 'lucide-react';
import type { GameRecord } from '../data/gameModels';
import type { ProjectStatus } from '../data/projectStatus';
import type { LibraryRoot } from '../services/db';
import { getProofLaunchGames } from '../services/proofGameService';
import { GAME_GENRES } from '../data/libraryFacets';
import {
  deriveArcadePlatformTabs,
  filterArcadeCatalog,
  platformLabel,
  type ArcadeFacetFilter,
} from '../services/arcadeCatalogService';
import {
  type ArcadeGamepadEdges,
} from '../services/arcadeGamepadService';
import { useArcadeGamepadListener } from '../hooks/useArcadeGamepadListener';
import { GameTile } from './GameTile';
import { ShellGamepadHintRail } from './ShellGamepadHintRail';
import { ArcadeGameDetail } from './ArcadeGameDetail';
import {
  getBecauseYouPlayedShelf,
  getContinuePlaying,
  getMostPlayed,
} from '../services/recommendationService';
import { detectDuplicateCandidates } from '../services/searchService';
import { checkLaunchReadiness, launchGame, getDemoMode, simulateLaunchGame } from '../services/launchService';
import type { LaunchBlocker, LaunchResult } from '../services/launchService';
import { isTauriRuntime, terminateActiveEmulator, listConnectedDisplays, SHELL_FOCUS_RESTORE_FAILED_MESSAGE, type ConnectedDisplay } from '../services/tauriService';
import { addLedgerEvent } from '../services/db';
import { useEmulatorSessionLifecycle } from '../hooks/useEmulatorSessionLifecycle';
import {
  resolveLaunchDisplaySettings,
  formatDisplaySettingsSummary,
  type LaunchDisplaySettings,
} from '../services/launchDisplayService';
import { LaunchDisplayOverlay } from './LaunchDisplayOverlay';
import {
  formatEngineStatusSummary,
  formatEngineStatusTitle,
  getSystemEngineStatus,
  type SystemEngineStatus,
} from '../services/engineReadinessService';
import {
  formatShellExitHint,
  formatShellExitShortLabel,
  getShellExitMapping,
  type ShellExitMapping,
} from '../services/shellExitButtonService';

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
  shellExitMapping?: ShellExitMapping | null;
  onOpenShellExitSetup?: () => void;
  gamepadSuspended?: boolean;
}

export const ArcadeHome: React.FC<ArcadeHomeProps> = ({
  games,
  status,
  onToggleAdminMode,
  onQuickSingleIngress,
  onQuickBatchIngress,
  onToggleFavorite,
  onLaunchComplete,
  shellExitMapping: shellExitMappingProp,
  onOpenShellExitSetup,
  gamepadSuspended = false,
  demoMode: demoModeProp,
}) => {
  const [activeShelfIndex, setActiveShelfIndex] = useState(0);
  const [activeGameIndex, setActiveGameIndex] = useState(0);

  // Library browse: platform, facets, search
  const [platformFilter, setPlatformFilter] = useState('all');
  const [facetFilter, setFacetFilter] = useState<ArcadeFacetFilter>('all');
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toolbarSearchRef = useRef<HTMLInputElement>(null);
  const browseToolbarRef = useRef<HTMLElement>(null);
  const exitGameInFlightRef = useRef(false);
  const lastLaunchedGameIdRef = useRef<string | null>(null);
  const emulatorSessionActiveRef = useRef(false);
  const activeSessionIdRef = useRef<string | null>(null);

  // Launch state
  const [launchingGame, setLaunchingGame] = useState<GameRecord | null>(null);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
  const [launchBlockers, setLaunchBlockers] = useState<LaunchBlocker[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [shellRestoreFailure, setShellRestoreFailure] = useState<string | null>(null);
  const [localShellExitMapping, setLocalShellExitMapping] = useState<ShellExitMapping | null>(null);
  const [displayPickerGame, setDisplayPickerGame] = useState<GameRecord | null>(null);
  const [connectedDisplays, setConnectedDisplays] = useState<ConnectedDisplay[]>([]);
  const [displaySettings, setDisplaySettings] = useState<LaunchDisplaySettings | null>(null);
  const [launchDisplaySummary, setLaunchDisplaySummary] = useState<string | null>(null);

  const [activatedGameId, setActivatedGameId] = useState<string | null>(null);
  const [cardActionIndex, setCardActionIndex] = useState(0);
  const [detailGame, setDetailGame] = useState<GameRecord | null>(null);
  const [activeEngineStatus, setActiveEngineStatus] = useState<SystemEngineStatus | null>(null);
  const [launchReady, setLaunchReady] = useState(false);

  type ArcadeFocusZone = 'browse' | 'library';
  type BrowseRow = 'platform' | 'facet' | 'search';
  const [focusZone, setFocusZone] = useState<ArcadeFocusZone>('library');
  const [browseRow, setBrowseRow] = useState<BrowseRow>('platform');
  const [browsePlatformIndex, setBrowsePlatformIndex] = useState(0);
  const [browseFacetIndex, setBrowseFacetIndex] = useState(0);

  const demoMode = demoModeProp ?? getDemoMode();
  const shellExitMapping = shellExitMappingProp ?? localShellExitMapping;

  useEffect(() => {
    if (shellExitMappingProp != null || !isTauriRuntime()) {
      return;
    }
    void getShellExitMapping().then(setLocalShellExitMapping);
  }, [shellExitMappingProp]);

  const lastLaunchCommandRef = useRef<string>('');

  const runLaunch = useCallback(async (game: GameRecord, settings?: LaunchDisplaySettings) => {
    lastLaunchedGameIdRef.current = game.id;
    setIsLaunching(true);
    setLaunchDisplaySummary(settings ? formatDisplaySettingsSummary(settings, connectedDisplays) : null);
    let sessionActive = false;
    try {
      const result = demoMode ? simulateLaunchGame(game) : await launchGame(game, settings);
      if (result.command) {
        lastLaunchCommandRef.current = result.command;
      }
      if (result.sessionActive) {
        sessionActive = true;
        emulatorSessionActiveRef.current = true;
        setIsLaunching(false);
        setLaunchingGame(null);
        setLaunchResult(null);
        setLaunchBlockers([]);
        setShellRestoreFailure(null);
        return;
      }
      setIsLaunching(false);
      if (result.returnedCleanly) {
        setLaunchingGame(null);
        setLaunchResult(null);
        setLaunchBlockers([]);
        setShellRestoreFailure(null);
      } else {
        setLaunchingGame((current) => current ?? game);
        setLaunchResult(result);
      }
      onLaunchComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLaunchResult({
        success: false,
        command: lastLaunchCommandRef.current,
        error: message,
      });
      setLaunchingGame((current) => current ?? game);
      setIsLaunching(false);
    } finally {
      if (!sessionActive) {
        setLaunchDisplaySummary(null);
      }
    }
  }, [connectedDisplays, demoMode, onLaunchComplete]);

  const handleLaunchGame = useCallback(async (game: GameRecord, forceDisplayPicker = false) => {
    const readiness = await checkLaunchReadiness(game);
    setLaunchBlockers(readiness.blockers);

    if (!readiness.ready) {
      setLaunchingGame(game);
      setLaunchResult({ success: false, command: '', error: readiness.blockers[0]?.desc });
      return;
    }

    if (demoMode || !isTauriRuntime()) {
      setLaunchingGame(game);
      await runLaunch(game);
      return;
    }

    const displays = await listConnectedDisplays();
    setConnectedDisplays(displays);
    const { settings, skipPicker } = await resolveLaunchDisplaySettings(forceDisplayPicker, displays);

    if (skipPicker) {
      setLaunchingGame(game);
      await runLaunch(game, settings);
      return;
    }

    setLaunchResult(null);
    setDisplaySettings(settings);
    setDisplayPickerGame(game);
  }, [demoMode, runLaunch]);

  const handleDisplayPickerConfirm = useCallback(async (settings: LaunchDisplaySettings) => {
    const game = displayPickerGame;
    setDisplayPickerGame(null);
    setDisplaySettings(null);
    if (!game) {
      return;
    }
    setLaunchingGame(game);
    await runLaunch(game, settings);
  }, [displayPickerGame, runLaunch]);

  const handleDisplayPickerCancel = useCallback(() => {
    setDisplayPickerGame(null);
    setDisplaySettings(null);
    setLaunchingGame(null);
    setLaunchBlockers([]);
  }, []);

  const handleExitGame = useCallback(async () => {
    if (
      (!isLaunching && !emulatorSessionActiveRef.current) ||
      exitGameInFlightRef.current ||
      !isTauriRuntime()
    ) {
      return;
    }
    exitGameInFlightRef.current = true;
    try {
      await terminateActiveEmulator();
    } finally {
      window.setTimeout(() => {
        exitGameInFlightRef.current = false;
      }, 500);
    }
  }, [isLaunching]);

  // Memoize platform tabs and filtered catalog before shelf derivations
  const platformTabs = useMemo(() => deriveArcadePlatformTabs(games), [games]);

  const catalogGames = useMemo(
    () => filterArcadeCatalog(games, platformFilter, facetFilter, searchQuery),
    [games, platformFilter, facetFilter, searchQuery],
  );

  const genreFacetOptions = useMemo(() => {
    const scoped = filterArcadeCatalog(games, platformFilter, 'all', searchQuery);
    return GAME_GENRES.filter((genre) =>
      scoped.some((game) => game.tags.includes(`genre:${genre.id}`)),
    );
  }, [games, platformFilter, searchQuery]);

  const browseFacets = useMemo(
    () => [
      { id: 'all' as ArcadeFacetFilter, label: 'All Games' },
      { id: 'favorites' as const, label: 'Favorites' },
      { id: 'needs_config' as const, label: 'Needs Config' },
      { id: 'showcase' as const, label: 'Showcase' },
      ...genreFacetOptions.map((genre) => ({
        id: `genre:${genre.id}` as ArcadeFacetFilter,
        label: genre.label,
      })),
    ],
    [genreFacetOptions],
  );

  const { shelves, allGames, proofLaunchGames } = useMemo(() => {
    const activeGames = catalogGames;
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

    const continuePlaying = getContinuePlaying(activeGames);
    const mostPlayed = getMostPlayed(activeGames);
    const becauseYouPlayedShelf = getBecauseYouPlayedShelf(activeGames);

    const showcaseGames = activeGames
      .filter((g) => g.tags.includes('showcase:ui'))
      .sort((a, b) => a.title.localeCompare(b.title));

    const snesShowcaseGames = showcaseGames.filter((g) => g.systemId === 'snes');
    const nesShowcaseGames = showcaseGames.filter((g) => g.systemId === 'nes' && !g.tags.includes('showcase:hack'));
    const nesHackGames = showcaseGames.filter((g) => g.systemId === 'nes' && g.tags.includes('showcase:hack'));

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

    if (continuePlaying.length > 0) {
      list.push({
        id: 'continue_playing',
        title: 'Continue Playing',
        count: continuePlaying.length,
        games: continuePlaying,
      });
    }

    if (becauseYouPlayedShelf) {
      list.push({
        id: 'because_you_played',
        title: becauseYouPlayedShelf.title,
        count: becauseYouPlayedShelf.games.length,
        games: becauseYouPlayedShelf.games,
      });
    }

    if (mostPlayed.length > 0) {
      list.push({
        id: 'most_played',
        title: 'Played Again and Again',
        count: mostPlayed.length,
        games: mostPlayed,
      });
    }

    if (platformFilter === 'all' && showcaseGames.length > 0) {
      list.push({
        id: 'showcase_all',
        title: 'Showcase (SNES + NES)',
        count: showcaseGames.length,
        games: showcaseGames,
      });
    } else {
      if (snesShowcaseGames.length > 0) {
        list.push({
          id: 'snes_showcase',
          title: 'SNES Showcase (local library preview)',
          count: snesShowcaseGames.length,
          games: snesShowcaseGames,
        });
      }

      if (nesShowcaseGames.length > 0) {
        list.push({
          id: 'nes_showcase',
          title: 'NES Showcase (USA library preview)',
          count: nesShowcaseGames.length,
          games: nesShowcaseGames,
        });
      }

      if (nesHackGames.length > 0) {
        list.push({
          id: 'nes_hacks',
          title: 'NES Hacks (proof batch)',
          count: nesHackGames.length,
          games: nesHackGames,
        });
      }
    }

    for (const genre of GAME_GENRES) {
      const genreGames = activeGames
        .filter((g) => g.tags.includes(`genre:${genre.id}`))
        .sort((a, b) => a.title.localeCompare(b.title));
      if (genreGames.length > 0) {
        list.push({
          id: `genre_${genre.id}`,
          title: genre.label,
          count: genreGames.length,
          games: genreGames,
        });
      }
    }

    const proofIds = new Set(proofLaunchGames.map((g) => g.id));
    const isProofOnlyLibrary =
      proofLaunchGames.length > 0 &&
      activeGames.length === proofLaunchGames.length &&
      activeGames.every((g) => proofIds.has(g.id));

    const hasShowcase = snesShowcaseGames.length > 0 || nesShowcaseGames.length > 0;

    // Pass B proof-only: avoid duplicate Recently Added / Favorites / All shelves (same 2 tiles)
    if (!isProofOnlyLibrary || hasShowcase) {
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
  }, [catalogGames, games, demoMode, platformFilter]);

  const resetBrowseFocus = useCallback(() => {
    setActiveShelfIndex(0);
    setActiveGameIndex(0);
  }, []);

  const clearCardActivation = useCallback(() => {
    setActivatedGameId(null);
    setCardActionIndex(0);
  }, []);

  const handlePlatformChange = useCallback((platformId: string) => {
    setPlatformFilter(platformId);
    clearCardActivation();
    resetBrowseFocus();
  }, [clearCardActivation, resetBrowseFocus]);

  const handleFacetChange = useCallback((facet: ArcadeFacetFilter) => {
    setFacetFilter(facet);
    clearCardActivation();
    resetBrowseFocus();
  }, [clearCardActivation, resetBrowseFocus]);

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    setActiveSearchIndex(0);
    clearCardActivation();
    resetBrowseFocus();
  }, [clearCardActivation, resetBrowseFocus]);

  const focusGameById = useCallback((gameId: string) => {
    for (let shelfIdx = 0; shelfIdx < shelves.length; shelfIdx++) {
      const gameIdx = shelves[shelfIdx].games.findIndex((g) => g.id === gameId);
      if (gameIdx >= 0) {
        setActiveShelfIndex(shelfIdx);
        setActiveGameIndex(gameIdx);
        return;
      }
    }
  }, [shelves]);

  useEmulatorSessionLifecycle({
    onSessionStarted: (sessionId) => {
      activeSessionIdRef.current = sessionId;
      emulatorSessionActiveRef.current = true;
      setShellRestoreFailure(null);
    },
    onSessionFinished: (payload) => {
      activeSessionIdRef.current = null;
      emulatorSessionActiveRef.current = false;
      setIsLaunching(false);
      setLaunchDisplaySummary(null);

      const failed =
        payload.errorMessage ||
        payload.returnedCleanly === false ||
        payload.sessionReachedGame === false;

      if (failed) {
        const gameId = payload.gameId || lastLaunchedGameIdRef.current || '';
        const failedGame = games.find((g) => g.id === gameId) ?? launchingGame;
        if (failedGame) {
          setLaunchingGame(failedGame);
        }
        setLaunchResult({
          success: false,
          command: lastLaunchCommandRef.current,
          error: payload.errorMessage ?? payload.reason,
        });
        return;
      }

      setLaunchingGame(null);
      setLaunchResult(null);
      setLaunchBlockers([]);
      setShellRestoreFailure(null);
      const gameId = payload.gameId || lastLaunchedGameIdRef.current || '';
      if (gameId) {
        focusGameById(gameId);
      }
      onLaunchComplete?.();
    },
    onShellFocusRestored: (payload) => {
      setShellRestoreFailure(null);
      addLedgerEvent('shell_focus_restored', 'Shell focus restored after emulator exit', {
        gameId: payload.gameId,
        sessionId: payload.sessionId,
        stage: payload.stage ?? undefined,
      });
    },
    onShellFocusRestoreFailed: (payload) => {
      setShellRestoreFailure(SHELL_FOCUS_RESTORE_FAILED_MESSAGE);
      addLedgerEvent('shell_focus_restore_failed', 'Shell focus restore failed after emulator exit', {
        gameId: payload.gameId,
        sessionId: payload.sessionId,
        reasonCode: payload.reasonCode ?? undefined,
        stage: payload.stage ?? undefined,
      });
    },
  });

  // Active focused game in the carousel
  const activeShelf = shelves[activeShelfIndex];
  const activeGame = activeShelf?.games[activeGameIndex];
  const isCardActivated = Boolean(activeGame && activatedGameId === activeGame.id);

  const openGameDetails = useCallback((game: GameRecord) => {
    clearCardActivation();
    setDetailGame(game);
  }, [clearCardActivation]);

  const activateFocusedGame = useCallback(() => {
    if (!activeGame) {
      return;
    }
    setActivatedGameId(activeGame.id);
    setCardActionIndex(0);
  }, [activeGame]);

  const confirmCardAction = useCallback(() => {
    if (!activeGame || activatedGameId !== activeGame.id) {
      return;
    }
    if (cardActionIndex === 0) {
      clearCardActivation();
      void handleLaunchGame(activeGame);
      return;
    }
    openGameDetails(activeGame);
  }, [activeGame, activatedGameId, cardActionIndex, clearCardActivation, handleLaunchGame, openGameDetails]);

  const cyclePlatformTab = useCallback((direction: -1 | 1) => {
    if (platformTabs.length === 0) {
      return;
    }
    const currentIndex = platformTabs.findIndex((tab) => tab.id === platformFilter);
    const start = currentIndex >= 0 ? currentIndex : 0;
    const next = (start + direction + platformTabs.length) % platformTabs.length;
    handlePlatformChange(platformTabs[next].id);
    setBrowsePlatformIndex(next);
  }, [handlePlatformChange, platformFilter, platformTabs]);

  const stepBrowsePlatform = useCallback((direction: -1 | 1) => {
    cyclePlatformTab(direction);
  }, [cyclePlatformTab]);

  const stepBrowseFacet = useCallback((direction: -1 | 1) => {
    if (browseFacets.length === 0) {
      return;
    }
    const currentIndex = browseFacets.findIndex((facet) => facet.id === facetFilter);
    const start = currentIndex >= 0 ? currentIndex : browseFacetIndex;
    const next = (start + direction + browseFacets.length) % browseFacets.length;
    setBrowseFacetIndex(next);
    handleFacetChange(browseFacets[next].id);
  }, [browseFacetIndex, browseFacets, facetFilter, handleFacetChange]);

  const enterBrowseZone = useCallback((row: BrowseRow = 'platform') => {
    const platformIndex = platformTabs.findIndex((tab) => tab.id === platformFilter);
    const facetIndex = browseFacets.findIndex((facet) => facet.id === facetFilter);
    setBrowsePlatformIndex(platformIndex >= 0 ? platformIndex : 0);
    setBrowseFacetIndex(facetIndex >= 0 ? facetIndex : 0);
    setFocusZone('browse');
    setBrowseRow(row);
    clearCardActivation();
  }, [browseFacets, clearCardActivation, facetFilter, platformFilter, platformTabs]);

  const enterLibraryZone = useCallback(() => {
    setFocusZone('library');
    setActiveShelfIndex(0);
    setActiveGameIndex(0);
  }, []);

  useEffect(() => {
    if (focusZone === 'browse') {
      browseToolbarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusZone, browseRow]);

  useEffect(() => {
    if (!activeGame) {
      setActiveEngineStatus(null);
      return;
    }
    void getSystemEngineStatus(activeGame.systemId, activeGame.contentPath).then(setActiveEngineStatus);
  }, [activeGame]);

  useEffect(() => {
    if (!activeGame) {
      setLaunchReady(false);
      return;
    }
    void checkLaunchReadiness(activeGame).then((readiness) => setLaunchReady(readiness.ready));
  }, [activeGame]);

  useEffect(() => {
    if (activatedGameId && activeGame?.id !== activatedGameId) {
      clearCardActivation();
    }
  }, [activeShelfIndex, activeGameIndex, activeGame?.id, activatedGameId, clearCardActivation]);

  // Focus search input when overlay opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const focusToolbarSearch = useCallback(() => {
    toolbarSearchRef.current?.focus();
    toolbarSearchRef.current?.select();
  }, []);

  // Handle keyboard events (D-pad emulator)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const inSearchField =
        document.activeElement === toolbarSearchRef.current ||
        document.activeElement === searchInputRef.current;

      if (inSearchField && !['Escape', 'Enter', 'y', 'Y'].includes(e.key)) {
        return;
      }

      // 1. Launch overlay: exit running game or dismiss finished overlay
      if (launchingGame) {
        if (isLaunching && e.key === 'Escape') {
          void handleExitGame();
          e.preventDefault();
        } else if (!isLaunching && e.key === 'Escape') {
          setLaunchingGame(null);
          setLaunchResult(null);
          setLaunchBlockers([]);
        }
        return;
      }

      // 2. Game detail overlay — input handled by ArcadeGameDetail
      if (detailGame) {
        return;
      }

      // 3. Search Overlay active
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
            setIsSearchOpen(false);
            setSearchQuery('');
            setActiveSearchIndex(0);
            openGameDetails(selected);
          }
          e.preventDefault();
        }
        return;
      }

      // 4. Browse toolbar (library filters — between preview and shelves)
      if (focusZone === 'browse') {
        switch (e.key) {
          case 'ArrowUp':
            setBrowseRow((row) => (row === 'search' ? 'facet' : row === 'facet' ? 'platform' : row));
            e.preventDefault();
            break;
          case 'ArrowDown':
            if (browseRow === 'platform') {
              setBrowseRow('facet');
            } else if (browseRow === 'facet') {
              setBrowseRow('search');
            } else {
              enterLibraryZone();
            }
            e.preventDefault();
            break;
          case 'ArrowLeft':
            if (browseRow === 'platform') {
              stepBrowsePlatform(-1);
            } else if (browseRow === 'facet') {
              stepBrowseFacet(-1);
            }
            e.preventDefault();
            break;
          case 'ArrowRight':
            if (browseRow === 'platform') {
              stepBrowsePlatform(1);
            } else if (browseRow === 'facet') {
              stepBrowseFacet(1);
            }
            e.preventDefault();
            break;
          case 'Enter':
            if (browseRow === 'search') {
              focusToolbarSearch();
            } else if (browseRow === 'platform') {
              enterLibraryZone();
            } else {
              enterLibraryZone();
            }
            e.preventDefault();
            break;
          case 'Escape':
          case 'b':
          case 'B':
            enterLibraryZone();
            e.preventDefault();
            break;
          case 'y':
          case 'Y':
            setBrowseRow('search');
            focusToolbarSearch();
            e.preventDefault();
            break;
          default:
            break;
        }
        return;
      }

      // 5. Game shelf carousel
      if (shelves.length === 0) return;

      switch (e.key) {
        case 'ArrowUp':
          if (activeShelfIndex === 0 && !isCardActivated) {
            enterBrowseZone('facet');
            e.preventDefault();
            break;
          }
          clearCardActivation();
          setActiveShelfIndex((prev) => {
            const next = prev > 0 ? prev - 1 : prev;
            setActiveGameIndex(0);
            return next;
          });
          e.preventDefault();
          break;
        case 'ArrowDown':
          clearCardActivation();
          setActiveShelfIndex((prev) => {
            const next = prev < shelves.length - 1 ? prev + 1 : prev;
            setActiveGameIndex(0);
            return next;
          });
          e.preventDefault();
          break;
        case 'ArrowLeft':
          if (isCardActivated) {
            setCardActionIndex((prev) => (prev === 0 ? 1 : 0));
          } else {
            setActiveGameIndex((prev) => (prev > 0 ? prev - 1 : prev));
          }
          e.preventDefault();
          break;
        case 'ArrowRight':
          if (isCardActivated) {
            setCardActionIndex((prev) => (prev === 0 ? 1 : 0));
          } else {
            const currentShelfGames = shelves[activeShelfIndex]?.games || [];
            setActiveGameIndex((prev) =>
              prev < currentShelfGames.length - 1 ? prev + 1 : prev
            );
          }
          e.preventDefault();
          break;
        case 'Enter':
          if (isCardActivated) {
            confirmCardAction();
          } else if (activeGame) {
            activateFocusedGame();
          }
          e.preventDefault();
          break;
        case 'b':
        case 'B':
          if (isCardActivated) {
            clearCardActivation();
          } else {
            enterBrowseZone('facet');
          }
          e.preventDefault();
          break;
        case ' ':
        case 'x':
        case 'X':
          if (activeGame && !isCardActivated) {
            onToggleFavorite(activeGame);
          }
          e.preventDefault();
          break;
        case 'y':
        case 'Y':
          focusToolbarSearch();
          e.preventDefault();
          break;
        case '[':
          cyclePlatformTab(-1);
          e.preventDefault();
          break;
        case ']':
          cyclePlatformTab(1);
          e.preventDefault();
          break;
        case 'Escape':
          if (isCardActivated) {
            clearCardActivation();
          } else {
            onToggleAdminMode();
          }
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
    isCardActivated,
    isSearchOpen,
    searchQuery,
    activeSearchIndex,
    launchingGame,
    isLaunching,
    detailGame,
    allGames,
    onToggleFavorite,
    onToggleAdminMode,
    handleLaunchGame,
    handleExitGame,
    focusToolbarSearch,
    clearCardActivation,
    activateFocusedGame,
    confirmCardAction,
    openGameDetails,
    cyclePlatformTab,
    focusZone,
    browseRow,
    stepBrowsePlatform,
    stepBrowseFacet,
    enterBrowseZone,
    enterLibraryZone,
  ]);

  const handleGamepadNavigation = useCallback((edges: ArcadeGamepadEdges) => {
    if (displayPickerGame) {
      return;
    }

    if (launchingGame) {
      if (!isLaunching && (edges.menu || edges.back || edges.confirm)) {
        setLaunchingGame(null);
        setLaunchResult(null);
        setLaunchBlockers([]);
      }
      return;
    }

    if (detailGame) {
      return;
    }

    if (isSearchOpen) {
      const filteredSearchGames = allGames.filter((g) =>
        g.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (edges.menu || edges.back) {
        setIsSearchOpen(false);
        setSearchQuery('');
        setActiveSearchIndex(0);
      } else if (edges.left) {
        setActiveSearchIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (edges.right) {
        setActiveSearchIndex((prev) =>
          prev < filteredSearchGames.length - 1 ? prev + 1 : prev
        );
      } else if (edges.confirm) {
        const selected = filteredSearchGames[activeSearchIndex];
        if (selected) {
          setIsSearchOpen(false);
          setSearchQuery('');
          setActiveSearchIndex(0);
          openGameDetails(selected);
        }
      }
      return;
    }

    if (shelves.length === 0 && focusZone === 'library') {
      return;
    }

    if (focusZone === 'browse') {
      if (edges.back) {
        enterLibraryZone();
      } else if (edges.up) {
        setBrowseRow((row) => (row === 'search' ? 'facet' : row === 'facet' ? 'platform' : row));
      } else if (edges.down) {
        if (browseRow === 'platform') {
          setBrowseRow('facet');
        } else if (browseRow === 'facet') {
          setBrowseRow('search');
        } else {
          enterLibraryZone();
        }
      } else if (edges.left) {
        if (browseRow === 'platform') {
          stepBrowsePlatform(-1);
        } else if (browseRow === 'facet') {
          stepBrowseFacet(-1);
        }
      } else if (edges.right) {
        if (browseRow === 'platform') {
          stepBrowsePlatform(1);
        } else if (browseRow === 'facet') {
          stepBrowseFacet(1);
        }
      } else if (edges.confirm) {
        if (browseRow === 'search') {
          focusToolbarSearch();
        } else {
          enterLibraryZone();
        }
      } else if (edges.search) {
        setBrowseRow('search');
        focusToolbarSearch();
      } else if (edges.menu) {
        onToggleAdminMode();
      }
      return;
    }

    if (edges.shoulderLeft) {
      enterBrowseZone('platform');
      cyclePlatformTab(-1);
      return;
    }
    if (edges.shoulderRight) {
      enterBrowseZone('platform');
      cyclePlatformTab(1);
      return;
    }

    if (edges.back) {
      if (isCardActivated) {
        clearCardActivation();
      } else {
        enterBrowseZone('facet');
      }
      return;
    }

    if (edges.up) {
      if (activeShelfIndex === 0 && !isCardActivated) {
        enterBrowseZone('facet');
        return;
      }
      clearCardActivation();
      setActiveShelfIndex((prev) => {
        const next = prev > 0 ? prev - 1 : prev;
        setActiveGameIndex(0);
        return next;
      });
    } else if (edges.down) {
      clearCardActivation();
      setActiveShelfIndex((prev) => {
        const next = prev < shelves.length - 1 ? prev + 1 : prev;
        setActiveGameIndex(0);
        return next;
      });
    } else if (edges.left) {
      if (isCardActivated) {
        setCardActionIndex((prev) => (prev === 0 ? 1 : 0));
      } else {
        setActiveGameIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    } else if (edges.right) {
      if (isCardActivated) {
        setCardActionIndex((prev) => (prev === 0 ? 1 : 0));
      } else {
        const currentShelfGames = shelves[activeShelfIndex]?.games || [];
        setActiveGameIndex((prev) =>
          prev < currentShelfGames.length - 1 ? prev + 1 : prev
        );
      }
    } else if (edges.confirm && edges.menu && activeGame) {
      clearCardActivation();
      handleLaunchGame(activeGame, true);
    } else if (edges.confirm) {
      if (isCardActivated) {
        confirmCardAction();
      } else if (activeGame) {
        activateFocusedGame();
      }
    } else if (edges.favorite && activeGame && !isCardActivated) {
      onToggleFavorite(activeGame);
    } else if (edges.search) {
      enterBrowseZone('search');
      focusToolbarSearch();
    } else if (edges.menu) {
      onToggleAdminMode();
    }
  }, [
    shelves,
    activeShelfIndex,
    activeGame,
    isCardActivated,
    isSearchOpen,
    searchQuery,
    activeSearchIndex,
    launchingGame,
    isLaunching,
    detailGame,
    allGames,
    onToggleFavorite,
    onToggleAdminMode,
    handleLaunchGame,
    displayPickerGame,
    focusToolbarSearch,
    clearCardActivation,
    activateFocusedGame,
    confirmCardAction,
    openGameDetails,
    cyclePlatformTab,
    focusZone,
    browseRow,
    stepBrowsePlatform,
    stepBrowseFacet,
    enterBrowseZone,
    enterLibraryZone,
  ]);

  useArcadeGamepadListener(!gamepadSuspended && !displayPickerGame && !detailGame, {
    onEdges: handleGamepadNavigation,
  });

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
              className={`arcade-status-dot ${status.controllerState === 'connected' || status.controllerState === 'unmapped' ? 'active' : 'inactive'}`}
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
              className={`arcade-status-dot ${status.controllerState === 'connected' || status.controllerState === 'unmapped' ? 'active' : 'inactive'}`}
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

      {/* Selected game preview */}
      {activeGame && (
        <section className="arcade-hero arcade-preview-panel">
          {(activeGame.mappings?.artwork?.background ||
            activeGame.mappings?.artwork?.screenshot ||
            activeGame.mappings?.artwork?.boxart) ? (
            <img
              src={
                activeGame.mappings.artwork.background ||
                activeGame.mappings.artwork.screenshot ||
                activeGame.mappings.artwork.boxart
              }
              alt=""
              className="arcade-hero-art-bg"
              key={activeGame.id}
            />
          ) : null}
          <div className="arcade-hero-bg" />
          <div className="arcade-hero-content">
            <div className="arcade-hero-system-badge">{platformLabel(activeGame.systemId)}</div>
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

            {activeEngineStatus && !activeEngineStatus.ready && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '560px', margin: '12px 0' }}>
                <div className="arcade-hero-blocker-panel" style={{ margin: 0 }}>
                  <div className="arcade-hero-blocker-title">
                    <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {formatEngineStatusTitle(activeEngineStatus)}
                  </div>
                  <div className="arcade-hero-blocker-desc">{formatEngineStatusSummary(activeEngineStatus)}</div>
                </div>
                <button
                  className="arcade-admin-btn"
                  onClick={onToggleAdminMode}
                  style={{ alignSelf: 'flex-start', padding: '10px 16px', fontSize: '0.85rem' }}
                >
                  <Settings size={14} /> {activeEngineStatus.adminHint}
                </button>
              </div>
            )}

            <div className="arcade-hero-actions">
              <button
                className="arcade-btn-launch"
                onClick={() => handleLaunchGame(activeGame)}
                disabled={!launchReady}
              >
                <Play size={18} fill="#fff" /> Launch
              </button>
              <button
                className="arcade-btn-secondary"
                onClick={() => openGameDetails(activeGame)}
              >
                <Info size={16} /> Details
              </button>
              <button
                className="arcade-btn-secondary"
                onClick={() => onToggleFavorite(activeGame)}
              >
                <Heart size={16} fill={activeGame.favorite ? '#fff' : 'none'} />
                {activeGame.favorite ? 'Unfavorite' : 'Favorite'}
              </button>
            </div>
            {isCardActivated && (
              <p className="arcade-hero-hint">
                Left / Right to choose Launch or Details · A to confirm · B to cancel
              </p>
            )}
          </div>
        </section>
      )}

      {/* Library browse controls — below preview, above shelves */}
      <section
        ref={browseToolbarRef}
        className={`arcade-toolbar ${focusZone === 'browse' ? 'arcade-toolbar--focused' : ''}`}
        aria-label="Library browse controls"
      >
        <div className="arcade-toolbar-heading">
          <h2 className="arcade-toolbar-title">Browse Library</h2>
          {focusZone === 'browse' && (
            <span className="arcade-toolbar-focus-label">
              {browseRow === 'platform'
                ? 'Platform — ← → to change · ↓ for categories'
                : browseRow === 'facet'
                  ? 'Category — ← → to change · ↓ for search'
                  : 'Search — Y or Enter to type'}
            </span>
          )}
        </div>

        <div className="arcade-toolbar-row">
          <div className="arcade-platform-tabs" role="tablist" aria-label="Platform">
            {platformTabs.map((tab, tabIdx) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={platformFilter === tab.id}
                className={`ui-btn ui-btn--secondary ui-btn--sm arcade-platform-tab ${platformFilter === tab.id ? 'arcade-platform-tab--active' : ''} ${focusZone === 'browse' && browseRow === 'platform' && browsePlatformIndex === tabIdx ? 'arcade-platform-tab--focus' : ''}`}
                onClick={() => handlePlatformChange(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="arcade-platform-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <div
            className={`arcade-toolbar-search ${focusZone === 'browse' && browseRow === 'search' ? 'arcade-toolbar-search--focus' : ''}`}
          >
            <Search className="arcade-toolbar-search-icon" size={18} aria-hidden />
            <input
              ref={toolbarSearchRef}
              type="search"
              className="ui-input arcade-toolbar-search-input"
              placeholder="Search title, system, tags…"
              value={searchQuery}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              onFocus={() => {
                setFocusZone('browse');
                setBrowseRow('search');
              }}
              aria-label="Search library"
            />
            {searchQuery && (
              <button
                type="button"
                className="arcade-toolbar-search-clear"
                onClick={() => handleSearchQueryChange('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="arcade-filter-row" role="group" aria-label="Library filters">
          {browseFacets.map((facet, facetIdx) => (
            <button
              key={facet.id}
              type="button"
              className={`ui-btn ui-btn--ghost ui-btn--sm arcade-filter-chip ${facetFilter === facet.id ? 'arcade-filter-chip--active' : ''} ${focusZone === 'browse' && browseRow === 'facet' && browseFacetIndex === facetIdx ? 'arcade-filter-chip--focus' : ''}`}
              onClick={() => handleFacetChange(facet.id)}
            >
              {facet.label}
            </button>
          ))}
        </div>
      </section>

      {/* Game shelves */}
      <section className="arcade-shelves-container">
        {shelves.length === 0 ? (
          <div className="arcade-empty-filter">
            <Search size={28} aria-hidden />
            <h2>No games match these filters</h2>
            <p>
              Try another platform tab, clear search, or choose <strong>All Games</strong>.
              NES and SNES showcase titles hydrate automatically from your local Aries ROM folders.
            </p>
            <button
              type="button"
              className="arcade-admin-btn"
              onClick={() => {
                handlePlatformChange('all');
                handleFacetChange('all');
                handleSearchQueryChange('');
              }}
            >
              Reset browse filters
            </button>
          </div>
        ) : (
          shelves.map((shelf, shelfIdx) => (
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
                  isActivated={activatedGameId === game.id}
                  actionIndex={activatedGameId === game.id ? cardActionIndex : 0}
                  onSelect={() => {
                    setActiveShelfIndex(shelfIdx);
                    setActiveGameIndex(gameIdx);
                    setActivatedGameId(game.id);
                    setCardActionIndex(0);
                  }}
                  onLaunch={() => {
                    clearCardActivation();
                    void handleLaunchGame(game);
                  }}
                  onDetails={() => openGameDetails(game)}
                />
              ))}
            </div>
          </div>
          ))
        )}
      </section>

      {/* Hint Rail */}
      <footer className="arcade-hint-rail">
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-a">A</span>
          <span>Select / Confirm</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-b">B</span>
          <span>Back / Filters</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-x">X</span>
          <span>Favorite</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-y">Y</span>
          <span>Search</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-menu">↑</span>
          <span>Browse Filters</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-menu">L1</span>
          <span>Prev Platform</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-menu">R1</span>
          <span>Next Platform</span>
        </div>
        <div className="arcade-hint-item">
          <span className="arcade-hint-button action-menu">Start</span>
          <span>Admin</span>
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
                    onSelect={() => setActiveSearchIndex(idx)}
                    onLaunch={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      void handleLaunchGame(game);
                    }}
                    onDetails={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      openGameDetails(game);
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

      {/* Display picker — shown before emulator launch when settings are not sticky */}
      {displayPickerGame && displaySettings && (
        <LaunchDisplayOverlay
          game={displayPickerGame}
          displays={connectedDisplays}
          initialSettings={displaySettings}
          onConfirm={(settings) => void handleDisplayPickerConfirm(settings)}
          onCancel={handleDisplayPickerCancel}
        />
      )}

      {/* Launch / Blocker Overlay */}
      {launchingGame && !displayPickerGame && (
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
              {isLaunching && launchDisplaySummary && (
                <p style={{ color: 'var(--color-text-muted)', maxWidth: '600px', textAlign: 'center', marginTop: '-8px' }}>
                  {launchDisplaySummary}
                </p>
              )}
              {isLaunching && (
                <div className="launch-overlay-spinner" style={{ margin: '24px auto' }} />
              )}
              
              {!isLaunching && shellRestoreFailure && (
                <p style={{ color: 'var(--color-warning)', maxWidth: '600px', textAlign: 'center' }}>
                  {shellRestoreFailure}
                </p>
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
                  ? formatShellExitHint(shellExitMapping)
                  : launchResult?.returnedCleanly
                    ? 'Arcade Home will restore automatically.'
                    : launchResult?.success
                      ? 'Press A, B, Start, Select, or Esc to close this overlay.'
                      : 'Press A, B, Start, Select, or Esc to close this overlay.'}
              </p>
              {isLaunching ? (
                <div className="arcade-hint-rail" style={{ marginTop: '24px', justifyContent: 'center' }}>
                  <div className="arcade-hint-item">
                    <span className="arcade-hint-button action-menu">Select + Start</span>
                    <span>Hold 1s to return (always works)</span>
                  </div>
                  <div className="arcade-hint-item">
                    <span className="arcade-hint-button action-y">Guide</span>
                    <span>Press Home to return</span>
                  </div>
                  {shellExitMapping ? (
                    <div className="arcade-hint-item">
                      <span className="arcade-hint-button action-menu">{formatShellExitShortLabel(shellExitMapping)}</span>
                      <span>Your custom return button</span>
                    </div>
                  ) : (
                    <div className="arcade-hint-item">
                      <span className="arcade-hint-button action-menu">Optional</span>
                      <span>
                        Map a different return button in{' '}
                        <button
                          type="button"
                          className="arcade-inline-link"
                          onClick={() => onOpenShellExitSetup?.()}
                        >
                          Controllers
                        </button>
                      </span>
                    </div>
                  )}
                  <div className="arcade-hint-item">
                    <span className="arcade-hint-button action-x" style={{ backgroundColor: '#64748b' }}>Esc</span>
                    <span>Keyboard fallback</span>
                  </div>
                </div>
              ) : (
                <ShellGamepadHintRail
                  hints={[
                    { button: 'A', label: 'Close overlay', tone: 'confirm' },
                    { button: 'B', label: 'Close overlay', tone: 'back' },
                    { button: 'Start', label: 'Close overlay', tone: 'menu' },
                  ]}
                />
              )}
            </>
          )}
        </div>
      )}

      {detailGame && (
        <ArcadeGameDetail
          game={detailGame}
          libraryGames={games}
          onClose={() => setDetailGame(null)}
          onSelectGame={(game) => setDetailGame(game)}
          onLaunch={(game) => {
            setDetailGame(null);
            void handleLaunchGame(game);
          }}
          onToggleFavorite={onToggleFavorite}
          onOpenAdmin={onToggleAdminMode}
        />
      )}
    </div>
  );
};
