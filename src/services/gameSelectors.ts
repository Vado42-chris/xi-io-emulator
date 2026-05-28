import type { GameRecord, IngressMode } from '../data/gameModels';

/**
 * Select games that are visible (not hidden).
 */
export const selectVisibleGames = (games: GameRecord[]): GameRecord[] => {
  return games.filter(game => !game.hidden);
};

/**
 * Select games that are hidden.
 */
export const selectHiddenGames = (games: GameRecord[]): GameRecord[] => {
  return games.filter(game => game.hidden);
};

/**
 * Select games filtered by their ingress mode.
 */
export const selectGamesByIngress = (games: GameRecord[], mode: IngressMode): GameRecord[] => {
  return games.filter(game => game.ingressMode === mode);
};

/**
 * Select games that need configuration (launchStatus is 'not_configured').
 */
export const selectGamesNeedingConfig = (games: GameRecord[]): GameRecord[] => {
  return games.filter(game => game.launchStatus === 'not_configured');
};
