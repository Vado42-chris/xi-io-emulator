import type { GameRecord } from '../data/gameModels';

export interface LibraryRoot {
  id: string;
  label: string;
  path: string;
  expectedDevice?: string;
  systems: string[];
  mounted: boolean;
  lastSeenAt?: string;
  lastScanAt?: string;
  createdAt: string;
  updatedAt: string;
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
  addLedgerEvent('database_cleared', 'Database states cleared');
};
