import type { GameGenreId } from './libraryFacets';

/** Local SNES library root on Aries — reference-only import (ROMs never moved). */
export const ARIES_SNES_ROM_ROOT =
  '/media/chrishallberg/Storage 22/Games/emulators/ROMS/Super Nintendo for PC (Every SNES Rom N Emu EVER) (11337 roms)/ROMS';

export interface SnesShowcaseEntry {
  /** Clean title shown in UI */
  displayTitle: string;
  /** Exact filename under ARIES_SNES_ROM_ROOT */
  fileName: string;
  genre: GameGenreId;
  year: number;
  players: string;
  region: 'usa' | 'europe' | 'japan';
  favorite?: boolean;
}

/** Curated cross-genre shelf for UI preview — one iconic title per genre where possible. */
export const SNES_SHOWCASE_CATALOG: SnesShowcaseEntry[] = [
  {
    displayTitle: 'Super Mario World',
    fileName: 'Super Mario World (U) [!].smc',
    genre: 'platformer',
    year: 1991,
    players: '1-2',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: "Super Mario World 2: Yoshi's Island",
    fileName: 'Super Mario World 2 - Yoshi\'s Island (U) (M3) (V1.0) [!].smc',
    genre: 'platformer',
    year: 1995,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'Donkey Kong Country',
    fileName: 'Donkey Kong Country (U) (V1.2) [!].smc',
    genre: 'platformer',
    year: 1994,
    players: '1-2',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: 'The Legend of Zelda: A Link to the Past',
    fileName: 'Legend of Zelda, The - A Link to the Past (U) [!].smc',
    genre: 'action-adventure',
    year: 1992,
    players: '1',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: 'Super Metroid',
    fileName: 'Super Metroid (E) [!].smc',
    genre: 'action-adventure',
    year: 1994,
    players: '1',
    region: 'europe',
    favorite: true,
  },
  {
    displayTitle: 'Chrono Trigger',
    fileName: 'Chrono Trigger (U) [!].smc',
    genre: 'rpg',
    year: 1995,
    players: '1',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: 'Final Fantasy VI',
    fileName: 'Final Fantasy III (U) (V1.0) [!].smc',
    genre: 'rpg',
    year: 1994,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'EarthBound',
    fileName: 'Earthbound (U) [!].smc',
    genre: 'rpg',
    year: 1995,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'Secret of Mana',
    fileName: 'Secret of Mana (U) [!].smc',
    genre: 'action-rpg',
    year: 1993,
    players: '1-3',
    region: 'usa',
  },
  {
    displayTitle: 'Mega Man X',
    fileName: 'Mega Man X (U) (V1.1) [!].smc',
    genre: 'action',
    year: 1993,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'Super Mario Kart',
    fileName: 'Super Mario Kart (U) [!].smc',
    genre: 'racing',
    year: 1992,
    players: '1-2',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: 'F-Zero',
    fileName: 'F-ZERO (U) [!].smc',
    genre: 'racing',
    year: 1991,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'Street Fighter II: The World Warrior',
    fileName: 'Street Fighter II - The World Warrior (U) [!].smc',
    genre: 'fighting',
    year: 1992,
    players: '2',
    region: 'usa',
  },
  {
    displayTitle: 'Killer Instinct',
    fileName: 'Killer Instinct (U) (V1.1) [!].smc',
    genre: 'fighting',
    year: 1995,
    players: '1-2',
    region: 'usa',
  },
  {
    displayTitle: 'Star Fox',
    fileName: 'Star Fox (U) (V1.0) [!].smc',
    genre: 'shooter',
    year: 1993,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'Contra III: The Alien Wars',
    fileName: 'Contra III - The Alien Wars (U) [!].smc',
    genre: 'run-and-gun',
    year: 1992,
    players: '1-2',
    region: 'usa',
  },
  {
    displayTitle: 'NBA Jam',
    fileName: 'NBA Jam (U) (V1.0).smc',
    genre: 'sports',
    year: 1994,
    players: '1-4',
    region: 'usa',
  },
  {
    displayTitle: 'Tetris Attack',
    fileName: 'Tetris Attack (U) [!].smc',
    genre: 'puzzle',
    year: 1996,
    players: '1-2',
    region: 'usa',
  },
  {
    displayTitle: 'Pilotwings',
    fileName: 'Pilotwings (U) [!].smc',
    genre: 'simulation',
    year: 1991,
    players: '1',
    region: 'usa',
  },
];

export const SNES_SHOWCASE_VERSION = 'v2';
