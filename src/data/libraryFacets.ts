/** Filter facets for library / arcade shelves (v1 — pre-bulk-import). */
export const GAME_GENRES = [
  { id: 'platformer', label: 'Platformer' },
  { id: 'action-adventure', label: 'Action & Adventure' },
  { id: 'rpg', label: 'RPG' },
  { id: 'action-rpg', label: 'Action RPG' },
  { id: 'action', label: 'Action' },
  { id: 'racing', label: 'Racing' },
  { id: 'fighting', label: 'Fighting' },
  { id: 'shooter', label: 'Shooter' },
  { id: 'run-and-gun', label: 'Run and Gun' },
  { id: 'sports', label: 'Sports' },
  { id: 'puzzle', label: 'Puzzle' },
  { id: 'simulation', label: 'Simulation' },
] as const;

export type GameGenreId = (typeof GAME_GENRES)[number]['id'];

export const genreLabel = (genreId: GameGenreId): string =>
  GAME_GENRES.find((g) => g.id === genreId)?.label ?? genreId;
