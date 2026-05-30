import React, { useState, useEffect } from 'react';
import { NavigationRail } from './NavigationRail';
import type { ActiveTab } from './NavigationRail';
import { StatusPanel } from './StatusPanel';
import { initialProjectStatus } from '../data/projectStatus';
import type { GameRecord, GameSortOption, BatchIngressProgress } from '../data/gameModels';
import {
  getGameRecords,
  saveGameRecord,
  deleteGameRecord,
  getLibraryRoots,
  saveLibraryRoot,
  deleteLibraryRoot,
  getLedgerEvents,
  clearDatabase,
  addLedgerEvent,
  getEngineSettings,
  saveEngineSettings,
  getScanHistory,
  exportLibraryToCSV,
  getProofGameSettings,
} from '../services/db';
import type { LibraryRoot, LedgerEvent, EngineSettings, LibraryScanResult } from '../services/db';
import { ingressSingleGame, ingressBatchFolder } from '../services/ingressService';
import { 
  Gamepad, 
  FolderOpen, 
  Database, 
  Settings as SettingsIcon,
  Terminal,
  Trash2,
  Plus,
  FolderPlus,
  RefreshCw,
  FileCode,
  Search,
  AlertTriangle,
  X,
  Download,
  Info
} from 'lucide-react';

import { LibraryGrid } from './LibraryGrid';
import { GameDetailPanel } from './GameDetailPanel';
import { ArcadeHome } from './ArcadeHome';
import { ControllersPanel } from './ControllersPanel';
import { ShellExitSetupModal } from './ShellExitSetupModal';
import { EnginesPage } from '../pages/EnginesPage';
import {
  buildGameSearchIndex,
  detectDuplicateCandidates,
  filterGameSearchDocuments,
  sortGameSearchDocuments
} from '../services/searchService';
import {
  getDemoMode,
  launchGame,
  registerProofGameFromPath,
  setDemoMode,
} from '../services/launchService';
import {
  controllerStateForStatusPanel,
  syncLiveControllerSnapshot,
} from '../services/controllerService';
import { computeProofReadiness, launchReadinessFromProof } from '../services/proofReadinessService';
import { checkPathExists, isTauriRuntime } from '../services/tauriService';
import { useArcadeGamepadListener } from '../hooks/useArcadeGamepadListener';
import { useEmulatorSessionLifecycle } from '../hooks/useEmulatorSessionLifecycle';
import {
  getShellExitMapping,
  shouldShowShellExitSetup,
  type ShellExitMapping,
} from '../services/shellExitButtonService';
import {
  backfillShowcaseArtwork,
  hydrateAllUiShowcases,
  hydrateNesUiShowcase,
  hydrateSnesUiShowcase,
} from '../services/showcaseHydrationService';
import { ensureDefaultEngineSettings } from '../services/engineDiscoveryService';
import {
  reconcileAllGamesIngress,
  summarizeLibraryIngress,
  type LibraryIngressSummary,
} from '../services/ingressChecklistService';
import {
  subscribeBatchIngressProgress,
} from '../services/batchIngressProgress';
import {
  BatchIngressProgressPanel,
  LibraryIngressSummaryBar,
} from './IngressChecklistPanel';

export const AppShell: React.FC = () => {
  const [appMode, setAppMode] = useState<'arcade' | 'admin'>('arcade');
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [games, setGames] = useState<GameRecord[]>([]);
  const [roots, setRoots] = useState<LibraryRoot[]>([]);
  const [logs, setLogs] = useState<LedgerEvent[]>([]);
  const [engineSettings, setEngineSettings] = useState<EngineSettings>(getEngineSettings());
  const [scanHistory, setScanHistory] = useState<LibraryScanResult[]>(getScanHistory());
  const [ingressSummary, setIngressSummary] = useState<LibraryIngressSummary>(() =>
    summarizeLibraryIngress(getGameRecords()),
  );
  const [batchIngressProgress, setBatchIngressProgress] = useState<BatchIngressProgress | null>(null);
  const [reconcilingLibrary, setReconcilingLibrary] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all'); // all, single_game, batch_library, favorites, needing_config, hidden
  const [sortOption, setSortOption] = useState<GameSortOption>('title');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [launchStatusFilter, setLaunchStatusFilter] = useState<string>('all');
  const [identityStatusFilter, setIdentityStatusFilter] = useState<string>('all');
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState<boolean>(false);
  
  // Selected game for details modal panel
  const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);

  // Engine inputs & browse popovers
  const [raPath, setRaPath] = useState(engineSettings.retroarchBinaryPath);
  const [corePath, setCorePath] = useState(engineSettings.snesCorePath);
  const [fceuxPath, setFceuxPath] = useState(engineSettings.fceuxBinaryPath ?? 'Not set');
  const [raBrowseOpen, setRaBrowseOpen] = useState(false);
  const [coreBrowseOpen, setCoreBrowseOpen] = useState(false);
  const [fceuxBrowseOpen, setFceuxBrowseOpen] = useState(false);
  const [proofNesPath, setProofNesPath] = useState(getProofGameSettings().nesContentPath ?? '');
  const [proofSnesPath, setProofSnesPath] = useState(getProofGameSettings().snesContentPath ?? '');
  const [demoMode, setDemoModeState] = useState(getDemoMode());

  // Sync inputs when settings change from local storage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRaPath(engineSettings.retroarchBinaryPath);
    setCorePath(engineSettings.snesCorePath);
    setFceuxPath(engineSettings.fceuxBinaryPath ?? 'Not set');
  }, [engineSettings]);

  // Ingress forms state
  const [singleFileName, setSingleFileName] = useState('Super Mario World (USA).sfc');
  const [singlePath, setSinglePath] = useState('/home/user/retro/games/Super Mario World (USA).sfc');
  const [batchPath, setBatchPath] = useState('/media/arcade-usb/snes-roms');
  
  // Status panel projection
  const [projectStatus, setProjectStatus] = useState(initialProjectStatus);
  const [shellExitSetupOpen, setShellExitSetupOpen] = useState(false);
  const [shellExitSetupNonce, setShellExitSetupNonce] = useState(0);
  const [shellExitMapping, setShellExitMapping] = useState<ShellExitMapping | null>(null);

  const refreshState = async () => {
    const updatedGames = getGameRecords();
    const updatedRoots = getLibraryRoots();
    const updatedLogs = getLedgerEvents();
    const engine = getEngineSettings();
    const history = getScanHistory();

    setGames(updatedGames);
    setRoots(updatedRoots);
    setLogs(updatedLogs);
    setEngineSettings(engine);
    setScanHistory(history);
    setIngressSummary(summarizeLibraryIngress(updatedGames));

    // Compute status variables
    const proofSettings = getProofGameSettings();
    const hasProofPaths = Boolean(proofSettings.nesContentPath && proofSettings.snesContentPath);
    const storageState =
      updatedRoots.length === 0
        ? hasProofPaths
          ? 'configured' // #xar:controller-launch-proof/pass-b — proof ROM paths only; bulk roots deferred
          : 'not configured'
        : updatedRoots.every((r) => r.mounted)
          ? 'mounted'
          : updatedRoots.some((r) => r.mounted)
            ? 'configured'
            : 'offline';

    const proofSummary = await computeProofReadiness();
    const launchReadiness = launchReadinessFromProof(proofSummary);

    const ctrlSnapshot = await syncLiveControllerSnapshot();

    setProjectStatus(prev => ({
      ...prev,
      currentMilestone: 'XARCADE-CONTROLLER-LAUNCH-PROOF-001',
      storageState,
      controllerState: controllerStateForStatusPanel(ctrlSnapshot),
      launchReadiness,
      nesProofReady: proofSummary.nesProofReady,
      snesProofReady: proofSummary.snesProofReady,
      overallProofState: proofSummary.overallProofState,
    }));
  };

  useEffect(() => {
    // Seed initial events if empty
    const currentLogs = getLedgerEvents();
    if (currentLogs.length === 0) {
      addLedgerEvent('app_started', 'xi-io Emulator UI initialized (v0.1.0)');
      addLedgerEvent('settings_loaded', 'Loaded local default settings');
      addLedgerEvent('engine_missing', 'RetroArch path not configured (engine.retroarch.binary_path)');
      addLedgerEvent('core_missing', 'Snes9x core path not configured (engine.retroarch.snes_core_path)');
    }
    // Auto-detect engines, hydrate curated SNES + NES showcases, then refresh UI state
    const timer = setTimeout(() => {
      void (async () => {
        await ensureDefaultEngineSettings();
        backfillShowcaseArtwork();
        await hydrateAllUiShowcases();
        setReconcilingLibrary(true);
        try {
          const { games: reconciled, summary } = await reconcileAllGamesIngress();
          setGames(reconciled);
          setIngressSummary(summary);
        } finally {
          setReconcilingLibrary(false);
        }
        await refreshState();
      })();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return subscribeBatchIngressProgress(setBatchIngressProgress);
  }, []);

  useEmulatorSessionLifecycle({
    onSessionFinished: () => {
      void refreshState();
    },
    onShellFocusRestored: (payload) => {
      addLedgerEvent('shell_focus_restored', 'Shell focus restored after emulator exit', {
        gameId: payload.gameId,
        sessionId: payload.sessionId,
        stage: payload.stage ?? undefined,
      });
    },
    onShellFocusRestoreFailed: (payload) => {
      addLedgerEvent('shell_focus_restore_failed', 'Shell focus restore failed after emulator exit', {
        gameId: payload.gameId,
        sessionId: payload.sessionId,
        reasonCode: payload.reasonCode ?? undefined,
        stage: payload.stage ?? undefined,
      });
    },
  });

  const handleReconcileLibrary = async () => {
    setReconcilingLibrary(true);
    try {
      const { games: reconciled, summary } = await reconcileAllGamesIngress();
      setGames(reconciled);
      setIngressSummary(summary);
      addLedgerEvent('ingress_reconciled', `Reconciled ${summary.total} games (${summary.fullyIngested} fully ingressed)`);
    } finally {
      setReconcilingLibrary(false);
    }
  };

  // Keep controller status live on Arcade Home (Gamepad API requires periodic polling).
  useEffect(() => {
    const sync = () => {
      void refreshState();
    };
    const onGamepad = () => sync();
    window.addEventListener('gamepadconnected', onGamepad);
    window.addEventListener('gamepaddisconnected', onGamepad);
    const interval = window.setInterval(sync, 1500);
    return () => {
      window.removeEventListener('gamepadconnected', onGamepad);
      window.removeEventListener('gamepaddisconnected', onGamepad);
      window.clearInterval(interval);
    };
  }, []);

  useArcadeGamepadListener(appMode === 'admin' && !shellExitSetupOpen, {
    onMenu: () => setAppMode('arcade'),
    onConfirm: () => setAppMode('arcade'),
  });

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    void getShellExitMapping().then(setShellExitMapping);
    void shouldShowShellExitSetup().then((show) => {
      if (show) {
        setShellExitSetupNonce((nonce) => nonce + 1);
        setShellExitSetupOpen(true);
      }
    });
  }, []);

  const handleSingleIngress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleFileName.trim() || !singlePath.trim()) return;
    try {
      await ingressSingleGame(singleFileName, singlePath, 3145728);
      refreshState();
      // Reset inputs slightly differently to make sequential testing nice
      const defaultGames = [
        'Super Mario Kart (USA).sfc',
        'F-Zero (USA).sfc',
        'Street Fighter II (USA).sfc'
      ];
      const nextIndex = Math.floor(Math.random() * defaultGames.length);
      setSingleFileName(defaultGames[nextIndex]);
      setSinglePath(`/home/user/retro/games/${defaultGames[nextIndex]}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  const handleBatchIngress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchPath.trim()) return;

    const mockFiles = [
      { name: 'Super Metroid (USA).sfc', sizeBytes: 3145728 },
      { name: 'The Legend of Zelda - A Link to the Past (USA).sfc', sizeBytes: 4194304 },
      { name: 'Mega Man X (USA).smc', sizeBytes: 2097152 },
      { name: 'Chrono Trigger (USA).sfc', sizeBytes: 4194304 },
      { name: 'Donkey Kong Country (USA).sfc', sizeBytes: 4194304 }
    ];

    try {
      await ingressBatchFolder(batchPath, mockFiles);
      refreshState();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  const handleQuickSingleIngress = async () => {
    try {
      const defaultGames = [
        'Super Mario Kart (USA).sfc',
        'F-Zero (USA).sfc',
        'Street Fighter II (USA).sfc'
      ];
      const gameName = defaultGames[Math.floor(Math.random() * defaultGames.length)];
      await ingressSingleGame(gameName, `/home/user/retro/games/${gameName}`, 3145728);
      addLedgerEvent('game_ingressed', `Staged single game: ${gameName}`);
      refreshState();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleQuickBatchIngress = async () => {
    try {
      const mockFiles = [
        { name: 'Super Metroid (USA).sfc', sizeBytes: 3145728 },
        { name: 'The Legend of Zelda - A Link to the Past (USA).sfc', sizeBytes: 4194304 },
        { name: 'Mega Man X (USA).smc', sizeBytes: 2097152 },
        { name: 'Chrono Trigger (USA).sfc', sizeBytes: 4194304 },
        { name: 'Donkey Kong Country (USA).sfc', sizeBytes: 4194304 }
      ];
      await ingressBatchFolder('/media/arcade-usb/snes-roms', mockFiles);
      addLedgerEvent('batch_ingressed', 'Staged batch library: /media/arcade-usb/snes-roms');
      refreshState();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const toggleFavorite = (game: GameRecord) => {
    const updated = { ...game, favorite: !game.favorite };
    saveGameRecord(updated);
    addLedgerEvent(
      'game_record_modified',
      `Toggled favorite for "${game.title}" to ${updated.favorite}`,
      { gameId: game.id, favorite: updated.favorite }
    );
    refreshState();
  };

  const toggleHidden = (game: GameRecord) => {
    const updated = { ...game, hidden: !game.hidden };
    saveGameRecord(updated);
    addLedgerEvent(
      'game_record_modified',
      `Toggled hidden status for "${game.title}" to ${updated.hidden}`,
      { gameId: game.id, hidden: updated.hidden }
    );
    refreshState();
  };

  const handleDelete = (game: GameRecord) => {
    deleteGameRecord(game.id);
    addLedgerEvent('game_record_deleted', `Deleted game record for "${game.title}"`, { gameId: game.id });
    refreshState();
  };

  const handleClearDb = () => {
    if (window.confirm('Are you sure you want to clear the local library database? This will erase all game records and logs.')) {
      clearDatabase();
      refreshState();
    }
  };

  const toggleRootMount = (root: LibraryRoot) => {
    const updated = { ...root, mounted: !root.mounted };
    saveLibraryRoot(updated);
    addLedgerEvent(
      updated.mounted ? 'library_root_mounted' : 'library_root_unmounted',
      `Library root directory ${updated.mounted ? 'mounted' : 'unmounted'}: ${updated.path}`,
      { rootId: root.id }
    );

    // Dynamic warning alert event logging
    if (!updated.mounted) {
      const affectedGames = getGameRecords().filter(g => g.libraryRootId === root.id);
      affectedGames.forEach(g => {
        addLedgerEvent('game_launch_blocked', `Game "${g.title}" launch blocked: Storage root is unmounted`, { gameId: g.id });
      });
    }

    refreshState();
  };

  const toggleRootPermission = (root: LibraryRoot) => {
    const updated = { ...root, permissionDenied: !root.permissionDenied };
    saveLibraryRoot(updated);
    addLedgerEvent(
      updated.permissionDenied ? 'library_root_permission_denied' : 'library_root_permission_granted',
      `Library root directory permission ${updated.permissionDenied ? 'revoked' : 'granted'}: ${updated.path}`,
      { rootId: root.id }
    );
    refreshState();
  };

  const handleDeleteRoot = (id: string, path: string) => {
    deleteLibraryRoot(id);
    addLedgerEvent('library_root_deleted', `Removed library root folder: ${path}`, { rootId: id });
    refreshState();
  };

  const handleCSVExport = () => {
    const csvContent = exportLibraryToCSV(games);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xibalba_library_catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLedgerEvent('library_exported', 'Exported library records to CSV');
  };

  const handleTestEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!raPath.trim() || raPath === 'Not set' || !corePath.trim() || corePath === 'Not set') &&
      (!fceuxPath.trim() || fceuxPath === 'Not set')
    ) {
      const updated: EngineSettings = {
        retroarchBinaryPath: raPath,
        snesCorePath: corePath,
        fceuxBinaryPath: fceuxPath,
        testStatus: 'failed',
        detectedVersion: undefined,
        launchStrategy: undefined,
        lastTestedAt: new Date().toLocaleTimeString()
      };
      saveEngineSettings(updated);
      addLedgerEvent('engine_test_failed', 'Engine validation failed: configure FCEUX and/or RetroArch paths');
      refreshState();
      return;
    }

    const missing: string[] = [];
    if (isTauriRuntime()) {
      if (fceuxPath && fceuxPath !== 'Not set') {
        const fceuxCheck = await checkPathExists(fceuxPath);
        if (!fceuxCheck.exists) missing.push(`FCEUX not found: ${fceuxPath}`);
      }
      if (raPath && raPath !== 'Not set') {
        const raCheck = await checkPathExists(raPath);
        if (!raCheck.exists) missing.push(`RetroArch not found: ${raPath}`);
      }
      if (corePath && corePath !== 'Not set') {
        const coreCheck = await checkPathExists(corePath);
        if (!coreCheck.exists) missing.push(`SNES core not found: ${corePath}`);
      }
    }

    if (missing.length > 0) {
      const updated: EngineSettings = {
        retroarchBinaryPath: raPath,
        snesCorePath: corePath,
        fceuxBinaryPath: fceuxPath,
        testStatus: 'failed',
        lastTestedAt: new Date().toLocaleTimeString(),
      };
      saveEngineSettings(updated);
      addLedgerEvent('engine_test_failed', missing.join('; '));
      refreshState();
      return;
    }

    let launchStrategy: 'native' | 'flatpak' | 'bundled' = 'native';
    if (raPath.toLowerCase().includes('flatpak') || raPath.toLowerCase().includes('org.libretro')) {
      launchStrategy = 'flatpak';
    }

    const version = isTauriRuntime()
      ? 'Paths verified on disk via Tauri'
      : 'Paths saved (verify on disk requires Tauri desktop shell)';
    const updated: EngineSettings = {
      retroarchBinaryPath: raPath,
      snesCorePath: corePath,
      fceuxBinaryPath: fceuxPath,
      testStatus: 'success',
      detectedVersion: version,
      launchStrategy,
      lastTestedAt: new Date().toLocaleTimeString()
    };
    saveEngineSettings(updated);
    addLedgerEvent('engine_detected', `Engine paths validated: ${version}`);
    refreshState();
  };

  const handleRegisterProofGame = async (systemId: 'nes' | 'snes', path: string) => {
    if (!path.trim()) return;
    try {
      await registerProofGameFromPath(systemId, path.trim());
      if (systemId === 'nes') setProofNesPath(path.trim());
      else setProofSnesPath(path.trim());
      refreshState();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  const handleLaunchFromShell = async (game: GameRecord) => {
    const result = await launchGame(game);
    refreshState();
    if (!result.success && result.error) {
      alert(result.error);
    }
  };

  const handleDemoModeToggle = (enabled: boolean) => {
    setDemoMode(enabled);
    setDemoModeState(enabled);
    addLedgerEvent('settings_loaded', `Demo mode ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleSelectGame = (game: GameRecord) => {
    setSelectedGame(game);
    addLedgerEvent(
      'game_inspected',
      `Opened metadata inspection panel for "${game.title}"`,
      { gameId: game.id }
    );
  };

  const handleTriggerSingleIngress = async () => {
    try {
      await ingressSingleGame('Super Mario World (USA).sfc', '/home/user/retro/games/Super Mario World (USA).sfc', 3145728);
      refreshState();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  const handleTriggerBatchIngress = async () => {
    const mockFiles = [
      { name: 'Super Metroid (USA).sfc', sizeBytes: 3145728 },
      { name: 'The Legend of Zelda - A Link to the Past (USA).sfc', sizeBytes: 4194304 },
      { name: 'Mega Man X (USA).smc', sizeBytes: 2097152 },
      { name: 'Chrono Trigger (USA).sfc', sizeBytes: 4194304 },
      { name: 'Donkey Kong Country (USA).sfc', sizeBytes: 4194304 }
    ];
    try {
      await ingressBatchFolder('/media/arcade-usb/snes-roms', mockFiles);
      refreshState();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(message);
    }
  };

  // Filter and sort games using the Search Index service
  const getFilteredGames = () => {
    const searchDocs = buildGameSearchIndex(games);
    const dupGroups = detectDuplicateCandidates(games);

    const favorite = filterMode === 'favorites' ? true : undefined;
    const hidden = filterMode === 'hidden' ? true : false;
    const needsConfig = filterMode === 'needing_config' ? true : undefined;
    const ingressMode = (filterMode === 'single_game' || filterMode === 'batch_library') 
      ? filterMode as 'single_game' | 'batch_library'
      : undefined;

    const filters = {
      systemId: selectedSystem === 'all' ? undefined : selectedSystem,
      ingressMode,
      launchStatus: launchStatusFilter === 'all' ? undefined : launchStatusFilter,
      identityStatus: identityStatusFilter === 'all' ? undefined : identityStatusFilter,
      favorite,
      hidden,
      needsConfig,
      isDuplicate: showOnlyDuplicates ? true : undefined,
      searchQuery: searchQuery
    };

    const filteredDocs = filterGameSearchDocuments(searchDocs, filters, dupGroups);
    const sortedDocs = sortGameSearchDocuments(filteredDocs, sortOption);

    return sortedDocs.map(doc => games.find(g => g.id === doc.gameId)!).filter(Boolean);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterMode('all');
    setSortOption('title');
    setSelectedSystem('all');
    setLaunchStatusFilter('all');
    setIdentityStatusFilter('all');
    setShowOnlyDuplicates(false);
  };

  const renderActiveView = () => {
    const systems = Array.from(new Set(games.map(g => g.systemId))).sort();
    const duplicateGroups = detectDuplicateCandidates(games);
    const duplicateCount = duplicateGroups.reduce((acc, g) => acc + g.gameIds.length, 0);

    switch (activeTab) {
      case 'library':
        return (
          <div className="content-card">
            <div className="view-header" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div className="view-title-container">
                  <Database className="color-accent" size={24} />
                  <h1 className="view-title">Game Library</h1>
                </div>
                <p className="view-subtitle">Browse and launch games across your mounted volumes</p>
              </div>
              <button className="btn-secondary" onClick={handleClearDb} style={{ color: 'var(--color-warning)', borderColor: 'rgba(255, 71, 87, 0.2)' }}>
                Reset Database
              </button>
            </div>

            {/* Ingress panels */}
            <div className="library-ingress-panels">
              <form className="ingress-card" onSubmit={handleSingleIngress}>
                <div className="ingress-card-title">
                  <FileCode size={16} className="color-accent" />
                  <span>Staging Single-Game Ingress</span>
                </div>
                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Filename</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={singleFileName} 
                    onChange={e => setSingleFileName(e.target.value)} 
                    placeholder="GameFile.sfc"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Content Path</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={singlePath} 
                    onChange={e => setSinglePath(e.target.value)} 
                    placeholder="/path/to/GameFile.sfc"
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '8px 12px', fontSize: '0.8rem', alignSelf: 'flex-start' }}>
                  <Plus size={14} /> Add Single Game
                </button>
              </form>

              <form className="ingress-card" onSubmit={handleBatchIngress}>
                <div className="ingress-card-title">
                  <FolderPlus size={16} className="color-accent" />
                  <span>Staging Batch-Library Ingress</span>
                </div>
                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>Folder Path</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={batchPath} 
                    onChange={e => setBatchPath(e.target.value)} 
                    placeholder="/media/roms/snes"
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                    <FolderOpen size={14} /> Scan & Ingress Folder
                  </button>
                </div>
              </form>
            </div>

            <LibraryIngressSummaryBar
              {...ingressSummary}
              onReconcile={handleReconcileLibrary}
              reconciling={reconcilingLibrary}
            />

            {batchIngressProgress && (
              <BatchIngressProgressPanel
                scanId={batchIngressProgress.scanId}
                folderPath={batchIngressProgress.folderPath}
                status={batchIngressProgress.status}
                filesTotal={batchIngressProgress.filesTotal}
                filesProcessed={batchIngressProgress.filesProcessed}
                gamesAdded={batchIngressProgress.gamesAdded}
                gamesFullyIngested={batchIngressProgress.gamesFullyIngested}
                gamesSkipped={batchIngressProgress.gamesSkipped}
                currentFileName={batchIngressProgress.currentFileName}
              />
            )}

            {/* Duplicate Advisory Notice */}
            {duplicateGroups.length > 0 && (
              <div className="duplicate-warning-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} className="warning-icon" />
                  <span className="warning-text">
                    <strong>Duplicate Candidates Notice:</strong> {duplicateCount} records mapped to {duplicateGroups.length} title groups. (Advisory only)
                  </span>
                </div>
                <button 
                  className={`btn-warning-advisory ${showOnlyDuplicates ? 'active' : ''}`}
                  onClick={() => setShowOnlyDuplicates(!showOnlyDuplicates)}
                >
                  {showOnlyDuplicates ? 'Show All Games' : 'Show Duplicate Candidates'}
                </button>
              </div>
            )}

            {/* Filter controls */}
            <div className="library-filters-container">
              {/* Row 1: Search & Sorting */}
              <div className="filters-row-primary">
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-text-muted)' }} />
                  <input 
                    type="text" 
                    className="library-search-input" 
                    style={{ paddingLeft: '30px', width: '100%' }}
                    placeholder="Search title, file name, system, tags..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="filter-group">
                    <span className="filter-label">Sort:</span>
                    <select 
                      className="filter-select"
                      value={sortOption}
                      onChange={e => setSortOption(e.target.value as GameSortOption)}
                    >
                      <option value="title">Alphabetical (Title)</option>
                      <option value="recently_added">Recently Added</option>
                      <option value="recently_played">Recently Played</option>
                      <option value="play_count">Play Count</option>
                      <option value="launch_status">Launch Status</option>
                    </select>
                  </div>

                  <span className="results-count">
                    {getFilteredGames().length} of {games.length} cataloged
                  </span>

                  {(searchQuery.trim() !== '' ||
                    filterMode !== 'all' ||
                    selectedSystem !== 'all' ||
                    launchStatusFilter !== 'all' ||
                    identityStatusFilter !== 'all' ||
                    showOnlyDuplicates ||
                    sortOption !== 'title') && (
                    <button 
                      className="btn-clear-filters"
                      onClick={handleClearFilters}
                      title="Reset all search queries, sort options, and dropdown selections"
                    >
                      <X size={14} /> Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Category Tabs & Dropdowns */}
              <div className="filters-row-secondary">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button className={`btn-secondary ${filterMode === 'all' && !showOnlyDuplicates ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '0.8rem', color: (filterMode === 'all' && !showOnlyDuplicates) ? 'var(--color-accent)' : '' }} onClick={() => { setFilterMode('all'); setShowOnlyDuplicates(false); }}>
                    All Cataloged
                  </button>
                  <button className={`btn-secondary ${filterMode === 'single_game' ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterMode === 'single_game' ? 'var(--color-accent)' : '' }} onClick={() => { setFilterMode('single_game'); setShowOnlyDuplicates(false); }}>
                    Single Games
                  </button>
                  <button className={`btn-secondary ${filterMode === 'batch_library' ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterMode === 'batch_library' ? 'var(--color-accent)' : '' }} onClick={() => { setFilterMode('batch_library'); setShowOnlyDuplicates(false); }}>
                    Batch Library
                  </button>
                  <button className={`btn-secondary ${filterMode === 'favorites' ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterMode === 'favorites' ? '#fbbf24' : '' }} onClick={() => { setFilterMode('favorites'); setShowOnlyDuplicates(false); }}>
                    Favorites
                  </button>
                  <button className={`btn-secondary ${filterMode === 'needing_config' ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterMode === 'needing_config' ? 'var(--color-accent)' : '' }} onClick={() => { setFilterMode('needing_config'); setShowOnlyDuplicates(false); }}>
                    Needing Config
                  </button>
                  <button className={`btn-secondary ${filterMode === 'hidden' ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterMode === 'hidden' ? 'var(--color-warning)' : '' }} onClick={() => { setFilterMode('hidden'); setShowOnlyDuplicates(false); }}>
                    Hidden ({games.filter(g => g.hidden).length})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
                  <div className="filter-group">
                    <span className="filter-label">System:</span>
                    <select 
                      className="filter-select"
                      value={selectedSystem}
                      onChange={e => setSelectedSystem(e.target.value)}
                    >
                      <option value="all">All Systems</option>
                      {systems.map(sys => (
                        <option key={sys} value={sys}>{sys.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <span className="filter-label">Launch Status:</span>
                    <select 
                      className="filter-select"
                      value={launchStatusFilter}
                      onChange={e => setLaunchStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="ready">Ready</option>
                      <option value="blocked">Blocked</option>
                      <option value="not_configured">Not Configured</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <span className="filter-label">Metadata:</span>
                    <select 
                      className="filter-select"
                      value={identityStatusFilter}
                      onChange={e => setIdentityStatusFilter(e.target.value)}
                    >
                      <option value="all">All Mappings</option>
                      <option value="normalized">Normalized</option>
                      <option value="raw">Raw</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Game catalog */}
            <LibraryGrid
              games={getFilteredGames()}
              libraryRoots={roots}
              onSelectGame={handleSelectGame}
              onToggleFavorite={toggleFavorite}
              onToggleHidden={toggleHidden}
              onDeleteGame={handleDelete}
              onTriggerSingleIngress={handleTriggerSingleIngress}
              onTriggerBatchIngress={handleTriggerBatchIngress}
              onClearFilters={handleClearFilters}
              isFiltered={
                searchQuery.trim() !== '' ||
                filterMode !== 'all' ||
                selectedSystem !== 'all' ||
                launchStatusFilter !== 'all' ||
                identityStatusFilter !== 'all' ||
                showOnlyDuplicates
              }
            />
          </div>
        );

      case 'controllers':
        return (
          <div className="content-card">
            <div className="view-header">
              <div className="view-title-container">
                <Gamepad className="color-accent" size={24} />
                <h1 className="view-title">Controllers</h1>
              </div>
              <p className="view-subtitle">
                Detect and test physical controllers for shell navigation and launch proof
              </p>
            </div>
            <ControllersPanel
              onSnapshotChange={(snapshot) => {
                setProjectStatus((prev) => ({
                  ...prev,
                  controllerState: controllerStateForStatusPanel(snapshot),
                }));
              }}
              onMappingChange={setShellExitMapping}
            />
          </div>
        );

      case 'storage':
        return (
          <div className="content-card">
            <div className="view-header">
              <div className="view-title-container">
                <FolderOpen className="color-accent" size={24} />
                <h1 className="view-title">Storage Configuration</h1>
              </div>
              <p className="view-subtitle">Add local folder roots or mounted secondary drives to scan</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Presets and Sandbox warnings */}
              <div className="form-group">
                <label className="form-label">Add Library Root Path</label>
                <form onSubmit={handleBatchIngress} style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={batchPath}
                    onChange={e => setBatchPath(e.target.value)}
                    placeholder="e.g. /media/user/ROMs/snes" 
                  />
                  <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
                    Scan & Register Root
                  </button>
                </form>

                {/* Presets */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>Presets:</span>
                  <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setBatchPath('/media/<user>/<drive>/Games/roms/snes')}>
                    Example SNES Library Path
                  </button>
                  <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setBatchPath('/media/arcade-usb/snes-roms')}>
                    USB Arcade Path
                  </button>
                  <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setBatchPath('/home/user/retro/games')}>
                    Local Retro Path
                  </button>
                </div>
              </div>

              {/* Policy & Sandbox */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '10px', backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <Info size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px 0', fontSize: '0.85rem' }}>Non-Destructive Scanning</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                      Xi-io scans catalog your games into a local SQLite/localStorage index. We never modify, rename, or delete files inside your directories.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <Info size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h5 style={{ fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px 0', fontSize: '0.85rem' }}>Flatpak Sandbox Mount Instructions</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                      If running in flatpak, grant filesystem access permissions to media folders:
                    </p>
                    <code style={{ display: 'block', backgroundColor: '#05060b', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.75rem', marginTop: '6px', color: '#60a5fa' }}>
                      flatpak override --user --filesystem=/media com.xi_io.Emulator
                    </code>
                  </div>
                </div>
              </div>

              {/* Active Storage Volumes */}
              <div style={{ marginTop: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: 600 }}>Active Storage Volumes</h3>
                {roots.length === 0 ? (
                  <div className="status-card" style={{ padding: '20px', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      No directories mapped. App is running in staged bootstrap mode.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {roots.map(root => {
                      const rootGames = games.filter(g => g.libraryRootId === root.id);
                      return (
                        <div key={root.id} className="status-card" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 600 }}>{root.label}</span>
                              <span className={`badge ${root.mounted ? 'ready' : 'not-configured'}`}>
                                {root.mounted ? 'mounted' : 'offline'}
                              </span>
                              <span className={`badge ${!root.permissionDenied ? 'ready' : 'not-configured'}`}>
                                {!root.permissionDenied ? 'read-write' : 'access denied'}
                              </span>
                            </div>
                            <span className="settings-desc" style={{ display: 'block', marginTop: '4px' }}>{root.path}</span>
                            <span className="settings-desc" style={{ color: 'var(--color-text)', display: 'block', marginTop: '2px', fontSize: '0.75rem' }}>
                              Contains: {rootGames.length} indexed game records
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => toggleRootMount(root)}>
                              {root.mounted ? 'Simulate Disconnect' : 'Simulate Connect'}
                            </button>
                            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => toggleRootPermission(root)}>
                              {root.permissionDenied ? 'Simulate Access Allowed' : 'Simulate Access Denied'}
                            </button>
                            <button className="btn-secondary" style={{ padding: '6px 6px', color: 'var(--color-warning)', borderColor: 'rgba(255, 71, 87, 0.2)' }} onClick={() => handleDeleteRoot(root.id, root.path)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Backup & CSV Export */}
              <div className="status-card" style={{ padding: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Backup & Library CSV Export</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Export all ingressed titles, file sizes, and directory links to a standard CSV file for easy database recovery or custom metadata inspection.
                  </p>
                </div>
                <button className="btn-primary" onClick={handleCSVExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
                  <Download size={16} /> Export Library CSV
                </button>
              </div>

              {/* Library Scan History */}
              <div style={{ marginTop: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: 600 }}>Library Scan History</h3>
                {scanHistory.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No scans have been performed yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {scanHistory.slice(0, 5).map(hist => (
                      <div key={hist.scanId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0c0d14', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <strong style={{ color: '#10b981' }}>Scan Successful</strong>
                            <span style={{ color: 'var(--color-text-muted)' }}>- {new Date(hist.startedAt).toLocaleTimeString()}</span>
                          </div>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                            Folder: {roots.find(r => r.id === hist.libraryRootId)?.path || 'Mapped Folder'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)' }}>
                          <span>Seen: <strong>{hist.filesSeen}</strong></span>
                          <span>Added: <strong style={{ color: '#10b981' }}>{hist.gamesAdded}</strong></span>
                          <span>Duplicates: <strong>{hist.duplicatesFound}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'engines':
        return (
          <EnginesPage
            engineSettings={engineSettings}
            raPath={raPath}
            corePath={corePath}
            fceuxPath={fceuxPath}
            proofNesPath={proofNesPath}
            proofSnesPath={proofSnesPath}
            raBrowseOpen={raBrowseOpen}
            coreBrowseOpen={coreBrowseOpen}
            fceuxBrowseOpen={fceuxBrowseOpen}
            onRaPathChange={setRaPath}
            onCorePathChange={setCorePath}
            onFceuxPathChange={setFceuxPath}
            onProofNesPathChange={setProofNesPath}
            onProofSnesPathChange={setProofSnesPath}
            onToggleRaBrowse={() => setRaBrowseOpen(!raBrowseOpen)}
            onToggleCoreBrowse={() => setCoreBrowseOpen(!coreBrowseOpen)}
            onToggleFceuxBrowse={() => setFceuxBrowseOpen(!fceuxBrowseOpen)}
            onTestEngine={handleTestEngine}
            onRegisterProofGame={handleRegisterProofGame}
          />
        );

      case 'settings':
        return (
          <div className="content-card">
            <div className="view-header">
              <div className="view-title-container">
                <SettingsIcon className="color-accent" size={24} />
                <h1 className="view-title">Settings</h1>
              </div>
              <p className="view-subtitle">Configure application settings and visual outcome mappings</p>
            </div>

            <div className="settings-list">
              <div className="settings-item">
                <div className="settings-meta">
                  <span className="settings-label">Demo Mode (simulate launch)</span>
                  <span className="settings-desc">When enabled, Play uses simulateLaunchGame instead of real process spawn</span>
                </div>
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => handleDemoModeToggle(e.target.checked)}
                />
              </div>

              <div className="settings-item">
                <div className="settings-meta">
                  <span className="settings-label">SNES UI Showcase Library</span>
                  <span className="settings-desc">
                    Re-import curated SNES titles from your local Aries ROM folder (metadata, tags, box art)
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  onClick={() => {
                    void (async () => {
                      const result = await hydrateSnesUiShowcase({ force: true });
                      await refreshState();
                      addLedgerEvent(
                        'showcase_hydration_completed',
                        `Manual SNES showcase refresh (${result.added} added, ${result.updated} updated, ${result.missing.length} missing)`
                      );
                    })();
                  }}
                >
                  <RefreshCw size={14} style={{ marginRight: '6px' }} />
                  Re-hydrate SNES
                </button>
              </div>

              <div className="settings-item">
                <div className="settings-meta">
                  <span className="settings-label">NES UI Showcase Library</span>
                  <span className="settings-desc">
                    Re-import curated NES USA + hack titles from your local Aries ROM folders
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  onClick={() => {
                    void (async () => {
                      const result = await hydrateNesUiShowcase({ force: true });
                      await refreshState();
                      addLedgerEvent(
                        'showcase_hydration_completed',
                        `Manual NES showcase refresh (${result.added} added, ${result.updated} updated, ${result.missing.length} missing)`
                      );
                    })();
                  }}
                >
                  <RefreshCw size={14} style={{ marginRight: '6px' }} />
                  Re-hydrate NES
                </button>
              </div>

              <div className="settings-item">
                <div className="settings-meta">
                  <span className="settings-label">Start Fullscreen</span>
                  <span className="settings-desc">Launch the xi-io Emulator shell in fullscreen mode</span>
                </div>
                <input type="checkbox" checked={false} disabled />
              </div>

              <div className="settings-item">
                <div className="settings-meta">
                  <span className="settings-label">Display Mode</span>
                  <span className="settings-desc">Outcome: Scale type and shader profile to apply globally</span>
                </div>
                <select className="form-input" style={{ width: '180px' }} disabled>
                  <option>Clean Pixels (Integer)</option>
                  <option>Soft CRT Simulation</option>
                  <option>None (Raw Stretch)</option>
                </select>
              </div>

              <div className="settings-item">
                <div className="settings-meta">
                  <span className="settings-label">Privacy Mode</span>
                  <span className="settings-desc">Ensure play histories, ROM names, and saves remain local-only</span>
                </div>
                <span className="badge ready">local-first active</span>
              </div>
            </div>
          </div>
        );

      case 'logs':
        return (
          <div className="content-card">
            <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="view-title-container">
                  <Terminal className="color-accent" size={24} />
                  <h1 className="view-title">Event Ledger & Logs</h1>
                </div>
                <p className="view-subtitle">Audited runtime events and diagnostics from the launch layer</p>
              </div>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={refreshState}>
                <RefreshCw size={14} /> Refresh Logs
              </button>
            </div>

            <div className="logs-terminal">
              {logs.map((log) => (
                <div key={log.id} className={`log-entry ${log.event.includes('failed') || log.event.includes('missing') || log.event.includes('blocked') ? 'error' : ''}`}>
                  <span className="log-time">[{log.timestamp}]</span>
                  <span className="log-event">{log.event.toUpperCase()}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <ShellExitSetupModal
        key={shellExitSetupNonce}
        open={shellExitSetupOpen}
        onClose={() => setShellExitSetupOpen(false)}
        onConfigured={(mapping) => setShellExitMapping(mapping)}
      />
      {appMode === 'admin' ? (
        <div className="app-container">
          <NavigationRail
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onToggleArcadeMode={() => setAppMode('arcade')}
          />
          <main className="main-content">
            {renderActiveView()}
          </main>
          <StatusPanel status={projectStatus} />
          {selectedGame && (
            <GameDetailPanel
              game={selectedGame}
              libraryRoot={roots.find(r => r.id === selectedGame.libraryRootId)}
              onClose={() => setSelectedGame(null)}
              onLaunch={(g) => void handleLaunchFromShell(g)}
              onToggleFavorite={(g) => {
                toggleFavorite(g);
                setSelectedGame(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
              }}
              onToggleHidden={(g) => {
                toggleHidden(g);
                setSelectedGame(prev => prev ? { ...prev, hidden: !prev.hidden } : null);
              }}
            />
          )}
        </div>
      ) : (
        <ArcadeHome
          games={games}
          status={projectStatus}
          roots={roots}
          demoMode={demoMode}
          shellExitMapping={shellExitMapping}
          onToggleAdminMode={() => setAppMode('admin')}
          onQuickSingleIngress={handleQuickSingleIngress}
          onQuickBatchIngress={handleQuickBatchIngress}
          onToggleFavorite={toggleFavorite}
          onLaunchComplete={refreshState}
          onOpenShellExitSetup={() => {
            setShellExitSetupNonce((nonce) => nonce + 1);
            setShellExitSetupOpen(true);
          }}
          gamepadSuspended={shellExitSetupOpen}
        />
      )}
    </>
  );
};
