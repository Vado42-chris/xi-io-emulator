// #xar:controller-launch-proof/current
import type { GameRecord } from '../data/gameModels';
import { getProofGameSettings } from './db';

/** Mock batch ingress path used in dev demos — not the user's real library. */
export const STALE_DEMO_LIBRARY_PREFIX = '/media/arcade-usb/';

export const isStaleDemoContentPath = (contentPath: string): boolean =>
  contentPath.startsWith(STALE_DEMO_LIBRARY_PREFIX);

export const getProofLaunchGames = (games: GameRecord[]): GameRecord[] => {
  const proof = getProofGameSettings();
  const ids = new Set([proof.nesGameId, proof.snesGameId].filter(Boolean));
  if (ids.size === 0) return [];
  return games.filter((g) => ids.has(g.id) && !g.hidden);
};

export const staleDemoLaunchBlocker = (game: GameRecord): { title: string; desc: string } => ({
  title: 'Stale demo library record (not your proof ROM)',
  desc: `This tile references a mock batch path that does not exist on your system: "${game.contentPath}". For Pass B, launch only from the "Pass B Launch Proof" shelf on Arcade Home, or re-register proof ROMs under Admin → Engines. Your real SNES proof ROM must live under your Storage drive path — not /media/arcade-usb/.`,
});
