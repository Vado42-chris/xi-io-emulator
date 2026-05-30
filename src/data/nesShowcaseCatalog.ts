import type { GameGenreId } from './libraryFacets';

export interface NesShowcaseEntry {
  displayTitle: string;
  fileName: string;
  genre: GameGenreId;
  year: number;
  players: string;
  region: 'usa' | 'europe' | 'japan';
  favorite?: boolean;
  /** Load from Hacks folder instead of USA */
  hack?: boolean;
}

/** Curated cross-genre NES shelf — one iconic USA title per genre where possible. */
export const NES_SHOWCASE_CATALOG: NesShowcaseEntry[] = [
  {
    displayTitle: 'Super Mario Bros. 3',
    fileName: 'Super Mario Bros 3 (U) (PRG 1).nes',
    genre: 'platformer',
    year: 1990,
    players: '1-2',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: "Kirby's Adventure",
    fileName: "Kirby's Adventure (U) (PRG 1) [!].nes",
    genre: 'platformer',
    year: 1993,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'The Legend of Zelda',
    fileName: 'Legend of Zelda, The (U) (PRG 1).nes',
    genre: 'action-adventure',
    year: 1987,
    players: '1',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: 'Metroid',
    fileName: 'Metroid (U).nes',
    genre: 'action-adventure',
    year: 1987,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'Final Fantasy',
    fileName: 'Final Fantasy (U).nes',
    genre: 'rpg',
    year: 1990,
    players: '1',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: 'Dragon Warrior',
    fileName: 'Dragon Warrior (U) (PRG 1).nes',
    genre: 'rpg',
    year: 1989,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'StarTropics',
    fileName: 'Startropics (U).nes',
    genre: 'action-rpg',
    year: 1990,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'Mega Man 2',
    fileName: 'Mega Man 2 (U).nes',
    genre: 'action',
    year: 1988,
    players: '1',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: 'Castlevania',
    fileName: 'Castlevania (U) (PRG 1).nes',
    genre: 'action',
    year: 1987,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'Rad Racer',
    fileName: 'Rad Racer (U).nes',
    genre: 'racing',
    year: 1987,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'RC Pro-Am',
    fileName: 'RC Pro-Am (U) (PRG 1).nes',
    genre: 'racing',
    year: 1988,
    players: '1-4',
    region: 'usa',
  },
  {
    displayTitle: 'Teenage Mutant Ninja Turtles: Tournament Fighters',
    fileName: 'Teenage Mutant Ninja Turtles Tournament Fighters (U).nes',
    genre: 'fighting',
    year: 1993,
    players: '1-2',
    region: 'usa',
  },
  {
    displayTitle: 'Double Dragon',
    fileName: 'Double Dragon (U).nes',
    genre: 'fighting',
    year: 1988,
    players: '1-2',
    region: 'usa',
  },
  {
    displayTitle: 'Gradius',
    fileName: 'Gradius (U).nes',
    genre: 'shooter',
    year: 1986,
    players: '1-2',
    region: 'usa',
  },
  {
    displayTitle: 'Contra',
    fileName: 'Contra (U).nes',
    genre: 'run-and-gun',
    year: 1988,
    players: '1-2',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: 'Tecmo Bowl',
    fileName: 'Tecmo Bowl (U) (PRG 1).nes',
    genre: 'sports',
    year: 1989,
    players: '1-2',
    region: 'usa',
  },
  {
    displayTitle: "Mike Tyson's Punch-Out!!",
    fileName: "Mike Tyson's Punch-Out!! (U) (PRG 1).nes",
    genre: 'sports',
    year: 1987,
    players: '1',
    region: 'usa',
  },
  {
    displayTitle: 'Tetris',
    fileName: 'Tetris (U) [!].nes',
    genre: 'puzzle',
    year: 1989,
    players: '1-2',
    region: 'usa',
    favorite: true,
  },
  {
    displayTitle: 'Bubble Bobble',
    fileName: 'Bubble Bobble (U).nes',
    genre: 'puzzle',
    year: 1988,
    players: '1-2',
    region: 'usa',
  },
  {
    displayTitle: 'Silent Service',
    fileName: 'Silent Service (U).nes',
    genre: 'simulation',
    year: 1989,
    players: '1',
    region: 'usa',
  },
  // Smaller hack batch — proves cross-platform shelves + future cheat path
  {
    displayTitle: 'Adventures of Ice Mario',
    fileName: 'Adventures of Ice Mario (SMB1 Hack).nes',
    genre: 'platformer',
    year: 1990,
    players: '1',
    region: 'usa',
    hack: true,
  },
  {
    displayTitle: '2600 Bros',
    fileName: '2600 Bros (SMB1 Hack).nes',
    genre: 'platformer',
    year: 1990,
    players: '1-2',
    region: 'usa',
    hack: true,
  },
  {
    displayTitle: 'Afro Mario Bros',
    fileName: 'Afro Mario Bros (Mario Bros Hack).nes',
    genre: 'action',
    year: 1983,
    players: '1-2',
    region: 'usa',
    hack: true,
  },
];

export const NES_SHOWCASE_VERSION = 'v3';
