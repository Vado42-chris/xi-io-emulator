import type { GameRecord } from '../data/gameModels';

const FRANCHISE_RULES: { id: string; label: string; patterns: RegExp[] }[] = [
  { id: 'mario', label: 'Mario', patterns: [/mario/i, /yoshi/i, /wario/i] },
  { id: 'zelda', label: 'Zelda', patterns: [/zelda/i, /link to the past/i, /hyrule/i] },
  { id: 'metroid', label: 'Metroid', patterns: [/metroid/i, /samus/i] },
  { id: 'mega-man', label: 'Mega Man', patterns: [/mega man/i, /megaman/i, /rockman/i] },
  { id: 'final-fantasy', label: 'Final Fantasy', patterns: [/final fantasy/i] },
  { id: 'dragon-quest', label: 'Dragon Quest', patterns: [/dragon warrior/i, /dragon quest/i] },
  { id: 'castlevania', label: 'Castlevania', patterns: [/castlevania/i, /symphony of the night/i] },
  { id: 'contra', label: 'Contra', patterns: [/contra/i] },
  { id: 'kirby', label: 'Kirby', patterns: [/kirby/i] },
  { id: 'donkey-kong', label: 'Donkey Kong', patterns: [/donkey kong/i, /dk country/i] },
  { id: 'street-fighter', label: 'Street Fighter', patterns: [/street fighter/i] },
  { id: 'star-fox', label: 'Star Fox', patterns: [/star fox/i, /starwing/i] },
  { id: 'fire-emblem', label: 'Fire Emblem', patterns: [/fire emblem/i] },
  { id: 'punch-out', label: 'Punch-Out!!', patterns: [/punch[- ]?out/i, /mike tyson/i] },
  { id: 'ninja-turtles', label: 'Teenage Mutant Ninja Turtles', patterns: [/ninja turtle/i, /tmnt/i] },
  { id: 'zelda-adjacent', label: 'Action RPG', patterns: [/secret of mana/i, /chrono trigger/i] },
];

export const getGameGenreId = (game: GameRecord): string | undefined => {
  const genreTag = game.tags.find((tag) => tag.startsWith('genre:'));
  return genreTag?.slice('genre:'.length);
};

export const getGameGenreLabel = (game: GameRecord): string | undefined => {
  const genreId = getGameGenreId(game);
  if (!genreId) return undefined;
  return genreId.replace(/-/g, ' ');
};

export const inferFranchiseId = (game: GameRecord): string | undefined => {
  const franchiseTag = game.tags.find((tag) => tag.startsWith('franchise:'));
  if (franchiseTag) {
    return franchiseTag.slice('franchise:'.length);
  }

  const haystack = `${game.title} ${game.originalFileName}`.toLowerCase();
  for (const rule of FRANCHISE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule.id;
    }
  }
  return undefined;
};

export const inferFranchiseLabel = (game: GameRecord): string | undefined => {
  const id = inferFranchiseId(game);
  if (!id) return undefined;
  return FRANCHISE_RULES.find((rule) => rule.id === id)?.label ?? id;
};

export const getGameDecade = (game: GameRecord): string | undefined => {
  const yearTag = game.tags.find((tag) => tag.startsWith('year:'));
  if (!yearTag) return undefined;
  const year = Number.parseInt(yearTag.slice('year:'.length), 10);
  if (Number.isNaN(year)) return undefined;
  return `${Math.floor(year / 10) * 10}s`;
};
