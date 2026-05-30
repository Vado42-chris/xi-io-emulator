import type { GameRecord } from '../data/gameModels';
import {
  getGameDecade,
  getGameGenreId,
  getGameGenreLabel,
  inferFranchiseId,
  inferFranchiseLabel,
} from './gameIdentityService';
import { getCoPlayCount, getCoPlayNeighbors, getLastPlayedGameId } from './playSessionService';

export interface GameRecommendation {
  game: GameRecord;
  score: number;
  reasons: string[];
}

const visibleGames = (library: GameRecord[]): GameRecord[] =>
  library.filter((game) => !game.hidden);

export const scoreSimilarity = (source: GameRecord, candidate: GameRecord): GameRecommendation | null => {
  if (source.id === candidate.id) return null;

  let score = 0;
  const reasons: string[] = [];

  const sourceFranchise = inferFranchiseId(source);
  const candidateFranchise = inferFranchiseId(candidate);
  if (sourceFranchise && candidateFranchise && sourceFranchise === candidateFranchise) {
    score += 50;
    reasons.push(`Same series (${inferFranchiseLabel(candidate) ?? candidateFranchise})`);
  }

  const sourceGenre = getGameGenreId(source);
  const candidateGenre = getGameGenreId(candidate);
  if (sourceGenre && candidateGenre && sourceGenre === candidateGenre) {
    score += 20;
    reasons.push(`Same genre (${getGameGenreLabel(candidate) ?? candidateGenre})`);
  }

  if (source.systemId === candidate.systemId) {
    score += 10;
    reasons.push(`Same platform (${candidate.systemId.toUpperCase()})`);
  }

  const sourceDecade = getGameDecade(source);
  const candidateDecade = getGameDecade(candidate);
  if (sourceDecade && candidateDecade && sourceDecade === candidateDecade) {
    score += 5;
    reasons.push(`Same era (${candidateDecade})`);
  }

  const coPlay = getCoPlayCount(source.id, candidate.id);
  if (coPlay > 0) {
    score += Math.min(coPlay * 15, 45);
    reasons.push(`Often played together (${coPlay}×)`);
  }

  if (candidate.favorite) {
    score += 5;
    reasons.push('Favorite');
  }

  if (candidate.playCount > 0) {
    score += Math.min(candidate.playCount * 2, 10);
  }

  if (score <= 0) return null;

  return { game: candidate, score, reasons };
};

export const getSimilarGames = (
  source: GameRecord,
  library: GameRecord[],
  limit = 6,
): GameRecommendation[] => {
  const scored = visibleGames(library)
    .map((candidate) => scoreSimilarity(source, candidate))
    .filter((entry): entry is GameRecommendation => entry !== null)
    .sort((a, b) => b.score - a.score || b.game.playCount - a.game.playCount);

  return scored.slice(0, limit);
};

export const getContinuePlaying = (library: GameRecord[], limit = 8): GameRecord[] =>
  visibleGames(library)
    .filter((game) => game.lastPlayedAt && game.playCount > 0)
    .sort((a, b) => {
      const timeA = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
      const timeB = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, limit);

export const getMostPlayed = (library: GameRecord[], limit = 8): GameRecord[] =>
  visibleGames(library)
    .filter((game) => game.playCount > 0)
    .sort((a, b) => b.playCount - a.playCount || a.title.localeCompare(b.title))
    .slice(0, limit);

export const getBecauseYouPlayed = (
  sourceGameId: string | undefined,
  library: GameRecord[],
  limit = 8,
): { sourceGame: GameRecord | null; recommendations: GameRecommendation[] } => {
  if (!sourceGameId) {
    return { sourceGame: null, recommendations: [] };
  }

  const sourceGame = library.find((game) => game.id === sourceGameId) ?? null;
  if (!sourceGame) {
    return { sourceGame: null, recommendations: [] };
  }

  const coPlayRecs = getCoPlayNeighbors(sourceGameId, limit)
    .map(({ gameId, count }) => {
      const game = library.find((entry) => entry.id === gameId);
      if (!game || game.hidden) return null;
      return {
        game,
        score: count * 20,
        reasons: [`Played after ${sourceGame.title} (${count}×)`],
      } satisfies GameRecommendation;
    })
    .filter((entry): entry is GameRecommendation => entry !== null);

  if (coPlayRecs.length >= limit) {
    return { sourceGame, recommendations: coPlayRecs.slice(0, limit) };
  }

  const similar = getSimilarGames(sourceGame, library, limit);
  const seen = new Set(coPlayRecs.map((entry) => entry.game.id));
  for (const rec of similar) {
    if (seen.has(rec.game.id)) continue;
    coPlayRecs.push(rec);
    seen.add(rec.game.id);
    if (coPlayRecs.length >= limit) break;
  }

  return { sourceGame, recommendations: coPlayRecs.slice(0, limit) };
};

export const getBecauseYouPlayedShelf = (
  library: GameRecord[],
  limit = 8,
): { title: string; games: GameRecord[] } | null => {
  const lastPlayedId = getLastPlayedGameId();
  const { sourceGame, recommendations } = getBecauseYouPlayed(lastPlayedId, library, limit);
  if (!sourceGame || recommendations.length === 0) return null;

  return {
    title: `Because you played ${sourceGame.title}`,
    games: recommendations.map((rec) => rec.game),
  };
};
