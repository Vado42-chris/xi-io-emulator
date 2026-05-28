import type { GameRecord } from '../data/gameModels';

export interface LibraryRoot {
  id: string;
  label: string;
  path: string;
  expectedDevice?: string;
  systems: string[];
  mounted: boolean;
  permissionDenied?: boolean;
  lastSeenAt?: string;
  lastScanAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EngineSettings {
  retroarchBinaryPath: string;
  snesCorePath: string;
  lastTestedAt?: string;
  testStatus: 'not_tested' | 'success' | 'failed';
  detectedVersion?: string;
  launchStrategy?: 'native' | 'flatpak' | 'bundled';
}

export interface StorageDiagnostic {
  severity: "info" | "warning" | "error";
  code:
    | "root_missing"
    | "permission_denied"
    | "unsupported_extension"
    | "duplicate_file"
    | "scan_failed";
  message: string;
  path?: string;
}

export interface LibraryScanResult {
  scanId: string;
  libraryRootId: string;
  startedAt: string;
  completedAt?: string;
  status: "completed" | "failed" | "cancelled";
  filesSeen: number;
  gamesAdded: number;
  gamesUpdated: number;
  gamesMissing: number;
  duplicatesFound: number;
  errors: StorageDiagnostic[];
}


export interface LedgerEvent {
  id: string;
  timestamp: string;
  event: string;
  message: string;
  details?: Record<string, unknown>;
}

const STORAGE_KEYS = {
  GAMES: 'xibalba_game_records',
  ROOTS: 'xibalba_library_roots',
  LEDGER: 'xibalba_ledger_events'
};

export const getGameRecords = (): GameRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GAMES);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveGameRecord = (record: GameRecord): void => {
  const records = getGameRecords();
  const index = records.findIndex(r => r.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(records));
};

export const deleteGameRecord = (id: string): void => {
  const records = getGameRecords();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(filtered));
};

export const getLibraryRoots = (): LibraryRoot[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ROOTS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveLibraryRoot = (root: LibraryRoot): void => {
  const roots = getLibraryRoots();
  const index = roots.findIndex(r => r.id === root.id);
  if (index >= 0) {
    roots[index] = root;
  } else {
    roots.push(root);
  }
  localStorage.setItem(STORAGE_KEYS.ROOTS, JSON.stringify(roots));
};

export const deleteLibraryRoot = (id: string): void => {
  const roots = getLibraryRoots();
  const filtered = roots.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.ROOTS, JSON.stringify(filtered));
};

export const getLedgerEvents = (): LedgerEvent[] => {
  const data = localStorage.getItem(STORAGE_KEYS.LEDGER);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const addLedgerEvent = (event: string, message: string, details?: Record<string, unknown>): void => {
  const events = getLedgerEvents();
  const newEvent: LedgerEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toLocaleTimeString(),
    event,
    message,
    details
  };
  events.unshift(newEvent); // Newest first
  localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(events));
};

export const clearDatabase = (): void => {
  localStorage.removeItem(STORAGE_KEYS.GAMES);
  localStorage.removeItem(STORAGE_KEYS.ROOTS);
  localStorage.removeItem(STORAGE_KEYS.LEDGER);
  localStorage.removeItem('xibalba_engine_settings');
  localStorage.removeItem('xibalba_scan_history');
  addLedgerEvent('database_cleared', 'Database states cleared');
};

const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  retroarchBinaryPath: 'Not set',
  snesCorePath: 'Not set',
  testStatus: 'not_tested'
};

export const getEngineSettings = (): EngineSettings => {
  const data = localStorage.getItem('xibalba_engine_settings');
  if (!data) return DEFAULT_ENGINE_SETTINGS;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_ENGINE_SETTINGS;
  }
};

export const saveEngineSettings = (settings: EngineSettings): void => {
  localStorage.setItem('xibalba_engine_settings', JSON.stringify(settings));
};

export const getScanHistory = (): LibraryScanResult[] => {
  const data = localStorage.getItem('xibalba_scan_history');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const addScanResult = (result: LibraryScanResult): void => {
  const history = getScanHistory();
  history.unshift(result); // Newest first
  localStorage.setItem('xibalba_scan_history', JSON.stringify(history));
};

export const exportLibraryToCSV = (games: GameRecord[]): string => {
  const headers = ['ID', 'System', 'Ingress Mode', 'Title', 'File Name', 'Content Path', 'File Size (Bytes)', 'Checksum', 'Launch Status', 'Favorite', 'Hidden'];
  const rows = games.map(g => {
    const cleanTitle = (g.title || '').replace(/"/g, '""');
    const cleanFileName = (g.originalFileName || '').replace(/"/g, '""');
    const cleanPath = (g.contentPath || '').replace(/"/g, '""');
    return [
      g.id,
      g.systemId,
      g.ingressMode,
      `"${cleanTitle}"`,
      `"${cleanFileName}"`,
      `"${cleanPath}"`,
      g.fileSizeBytes || 0,
      g.checksum || '',
      g.launchStatus,
      g.favorite ? 'TRUE' : 'FALSE',
      g.hidden ? 'TRUE' : 'FALSE'
    ];
  });
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

