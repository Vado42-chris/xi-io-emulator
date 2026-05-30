import type { GameRecord } from '../data/gameModels';
import { getGameRecords, saveGameRecord } from './db';

const SESSION_STATE_KEY = 'xibalba_play_session_state';
const COPLAY_MATRIX_KEY = 'xibalba_coplay_matrix';

interface PlaySessionState {
  lastLaunchedGameId?: string;
  lastLaunchedAt?: string;
}

type CoPlayMatrix = Record<string, Record<string, number>>;

const readSessionState = (): PlaySessionState => {
  const raw = localStorage.getItem(SESSION_STATE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PlaySessionState;
  } catch {
    return {};
  }
};

const writeSessionState = (state: PlaySessionState): void => {
  localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(state));
};

const readCoPlayMatrix = (): CoPlayMatrix => {
  const raw = localStorage.getItem(COPLAY_MATRIX_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as CoPlayMatrix;
  } catch {
    return {};
  }
};

const writeCoPlayMatrix = (matrix: CoPlayMatrix): void => {
  localStorage.setItem(COPLAY_MATRIX_KEY, JSON.stringify(matrix));
};

const bumpCoPlay = (fromGameId: string, toGameId: string): void => {
  if (fromGameId === toGameId) return;
  const matrix = readCoPlayMatrix();
  if (!matrix[fromGameId]) matrix[fromGameId] = {};
  if (!matrix[toGameId]) matrix[toGameId] = {};
  matrix[fromGameId][toGameId] = (matrix[fromGameId][toGameId] ?? 0) + 1;
  matrix[toGameId][fromGameId] = (matrix[toGameId][fromGameId] ?? 0) + 1;
  writeCoPlayMatrix(matrix);
};

/** Record a successful launch — updates playCount, lastPlayedAt, and co-play pairs. */
export const recordGameLaunch = (gameId: string): GameRecord | null => {
  const records = getGameRecords();
  const game = records.find((entry) => entry.id === gameId);
  if (!game) return null;

  const session = readSessionState();
  const now = new Date().toISOString();

  if (session.lastLaunchedGameId && session.lastLaunchedGameId !== gameId) {
    bumpCoPlay(session.lastLaunchedGameId, gameId);
  }

  const updated: GameRecord = {
    ...game,
    playCount: (game.playCount ?? 0) + 1,
    lastPlayedAt: now,
    updatedAt: now,
  };

  saveGameRecord(updated);
  writeSessionState({ lastLaunchedGameId: gameId, lastLaunchedAt: now });
  return updated;
};

export const getLastPlayedGameId = (): string | undefined => readSessionState().lastLaunchedGameId;

export const getLastPlayedAt = (): string | undefined => readSessionState().lastLaunchedAt;

export const getCoPlayCount = (gameAId: string, gameBId: string): number => {
  if (gameAId === gameBId) return 0;
  const matrix = readCoPlayMatrix();
  return matrix[gameAId]?.[gameBId] ?? 0;
};

export const getCoPlayNeighbors = (gameId: string, limit = 10): { gameId: string; count: number }[] => {
  const matrix = readCoPlayMatrix();
  const neighbors = matrix[gameId] ?? {};
  return Object.entries(neighbors)
    .map(([id, count]) => ({ gameId: id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export const clearPlaySessionData = (): void => {
  localStorage.removeItem(SESSION_STATE_KEY);
  localStorage.removeItem(COPLAY_MATRIX_KEY);
};
