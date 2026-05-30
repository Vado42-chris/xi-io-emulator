const STORAGE_KEY = 'xibalba_game_notes';

type NotesMap = Record<string, string>;

function readAll(): NotesMap {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as NotesMap;
  } catch {
    return {};
  }
}

function writeAll(notes: NotesMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getGameNotes(gameId: string): string {
  return readAll()[gameId] ?? '';
}

export function saveGameNotes(gameId: string, notes: string): void {
  const all = readAll();
  const trimmed = notes.trim();
  if (!trimmed) {
    delete all[gameId];
  } else {
    all[gameId] = trimmed;
  }
  writeAll(all);
}
