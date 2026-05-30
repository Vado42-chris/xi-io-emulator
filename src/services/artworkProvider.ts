import type { ArtworkMapping } from '../data/gameModels';

const LIBRETRO_SNES_BASE =
  'https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master';

const LIBRETRO_NES_BASE =
  'https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Nintendo_Entertainment_System/master';

const SNES_SPECIAL_MAPPINGS: Record<string, string> = {
  'super mario kart': 'Super Mario Kart (USA)',
  'f-zero': 'F-Zero (USA)',
  'f zero': 'F-Zero (USA)',
  'street fighter ii': 'Street Fighter II - The World Warrior (USA)',
  'street fighter ii the world warrior': 'Street Fighter II - The World Warrior (USA)',
  'super metroid': 'Super Metroid (Japan, USA) (En,Ja)',
  'the legend of zelda - a link to the past': 'Legend of Zelda, The - A Link to the Past (USA)',
  'the legend of zelda: a link to the past': 'Legend of Zelda, The - A Link to the Past (USA)',
  'legend of zelda, the - a link to the past': 'Legend of Zelda, The - A Link to the Past (USA)',
  'mega man x': 'Mega Man X (USA)',
  'chrono trigger': 'Chrono Trigger (USA)',
  'donkey kong country': 'Donkey Kong Country (USA)',
  'super mario world': 'Super Mario World (USA)',
  "super mario world 2 yoshi's island": "Super Mario World 2 - Yoshi's Island (USA)",
  'super mario world 2: yoshis island': "Super Mario World 2 - Yoshi's Island (USA)",
  'final fantasy vi': 'Final Fantasy III (USA)',
  'final fantasy iii': 'Final Fantasy III (USA)',
  earthbound: 'EarthBound (USA)',
  'secret of mana': 'Secret of Mana (USA)',
  'star fox': 'Star Fox (USA)',
  'contra iii the alien wars': 'Contra III - The Alien Wars (USA)',
  'contra iii: the alien wars': 'Contra III - The Alien Wars (USA)',
  'nba jam': 'NBA Jam (USA)',
  'tetris attack': 'Tetris Attack (USA)',
  pilotwings: 'Pilotwings (USA)',
  'killer instinct': 'Killer Instinct (USA)',
};

const NES_SPECIAL_MAPPINGS: Record<string, string> = {
  'super mario bros. 3': 'Super Mario Bros. 3 (USA)',
  'super mario bros 3': 'Super Mario Bros. 3 (USA)',
  "kirby's adventure": "Kirby's Adventure (USA)",
  'the legend of zelda': 'Legend of Zelda, The (USA)',
  'legend of zelda, the': 'Legend of Zelda, The (USA)',
  metroid: 'Metroid (USA)',
  'final fantasy': 'Final Fantasy (USA)',
  'dragon warrior': 'Dragon Warrior (USA)',
  startropics: 'StarTropics (USA)',
  'mega man 2': 'Mega Man 2 (USA)',
  castlevania: 'Castlevania (USA)',
  'rad racer': 'Rad Racer (USA)',
  'rc pro-am': 'R.C. Pro-Am (USA)',
  'r.c. pro-am': 'R.C. Pro-Am (USA)',
  'teenage mutant ninja turtles: tournament fighters':
    'Teenage Mutant Ninja Turtles - Tournament Fighters (USA)',
  'teenage mutant ninja turtles tournament fighters':
    'Teenage Mutant Ninja Turtles - Tournament Fighters (USA)',
  'double dragon': 'Double Dragon (USA)',
  gradius: 'Gradius (USA)',
  contra: 'Contra (USA)',
  'tecmo bowl': 'Tecmo Bowl (USA)',
  "mike tyson's punch-out!!": 'Punch-Out!! (USA)',
  'mike tysons punch-out!!': 'Punch-Out!! (USA)',
  tetris: 'Tetris (USA)',
  'bubble bobble': 'Bubble Bobble (USA)',
  'silent service': 'Silent Service (USA)',
};

/** Exact libretro TOSEC asset filenames keyed by ROM filename (including extension). */
const NES_ROM_FILENAME_ARTWORK: Record<string, string> = {
  'Adventures of Ice Mario (SMB1 Hack).nes':
    'Adventures of Ice Mario, The v0.8.1beta (1998-10-06)(Rage Games)[h][Super Mario Bros.].png',
  '2600 Bros (SMB1 Hack).nes': 'Angry Mario (200x)(HideJr)[h][Super Mario Bros.].png',
  'Afro Mario Bros (Mario Bros Hack).nes': 'Angry Mario (200x)(HideJr)[h][Super Mario Bros.].png',
};

const SNES_ROM_FILENAME_ARTWORK: Record<string, string> = {};

const stripRomDecorators = (fileName: string): string =>
  fileName
    .replace(/\.(nes|sfc|smc)$/i, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s*\(U\)\s*$/i, '')
    .trim();

/** Map a GoodTools-style ROM filename toward libretro No-Intro naming. */
export const romFileNameToDisplayTitle = (fileName: string): string => {
  let name = stripRomDecorators(fileName);
  name = name.replace(/\s*\(PRG \d+\)/i, '').trim();
  if (name.toLowerCase().startsWith('legend of zelda, the')) {
    return 'The Legend of Zelda';
  }
  return name;
};

const HACK_ART_FALLBACKS: Record<string, string> = {
  'adventures of ice mario':
    'Adventures of Ice Mario, The v0.8.1beta (1998-10-06)(Rage Games)[h][Super Mario Bros.].png',
  '2600 bros': 'Angry Mario (200x)(HideJr)[h][Super Mario Bros.].png',
  'afro mario bros': 'Angry Mario (200x)(HideJr)[h][Super Mario Bros.].png',
};

const escapeNoIntroFilename = (filename: string): string =>
  encodeURIComponent(filename)
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%2C/g, ',')
    .replace(/%26/g, '&');

const normalizeLookupKey = (title: string): string => {
  let lookupKey = title.trim().toLowerCase();
  lookupKey = lookupKey
    .replace(/\s*\(usa\)/i, '')
    .replace(/\s*\(u\)/i, '')
    .replace(/\s*\(europe\)/i, '')
    .replace(/\s*\(japan\)/i, '')
    .replace(/\s*\(en,ja\)/i, '')
    .replace(/\s*\(japan, usa\)/i, '')
    .trim();
  return lookupKey;
};

const resolveNoIntroName = (title: string, specialMappings: Record<string, string>): string => {
  let cleanTitle = title.trim();

  if (
    cleanTitle.toLowerCase().endsWith('.sfc') ||
    cleanTitle.toLowerCase().endsWith('.smc') ||
    cleanTitle.toLowerCase().endsWith('.nes')
  ) {
    cleanTitle = cleanTitle.substring(0, cleanTitle.lastIndexOf('.'));
  }

  cleanTitle = cleanTitle.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const lookupKey = normalizeLookupKey(cleanTitle);

  if (specialMappings[lookupKey]) {
    return specialMappings[lookupKey];
  }

  let resolvedName = cleanTitle;

  if (resolvedName.toLowerCase().startsWith('the ')) {
    const mainTitle = resolvedName.substring(4);
    if (!mainTitle.includes(',')) {
      resolvedName = `${mainTitle}, The`;
    }
  }

  resolvedName = resolvedName.replace(/:/g, ' -');

  const hasRegion = /\((usa|europe|japan|world|canada|france|germany|italy|spain|australia)/i.test(
    resolvedName,
  );
  if (!hasRegion) {
    resolvedName = `${resolvedName} (USA)`;
  }

  return resolvedName.replace(/\s+/g, ' ').trim();
};

export const getNoIntroFilename = (title: string, systemId = 'snes'): string =>
  resolveNoIntroName(title, systemId === 'nes' ? NES_SPECIAL_MAPPINGS : SNES_SPECIAL_MAPPINGS);

const buildArtworkUrls = (base: string, filename: string): ArtworkMapping => {
  const escapedFilename = escapeNoIntroFilename(filename);
  return {
    boxart: `${base}/Named_Boxarts/${escapedFilename}.png`,
    screenshot: `${base}/Named_Snaps/${escapedFilename}.png`,
    background: `${base}/Named_Snaps/${escapedFilename}.png`,
  };
};

/** Build URLs when the libretro asset filename already includes .png (TOSEC / hack names). */
const buildArtworkFromLibretroAsset = (base: string, assetFileName: string): ArtworkMapping => {
  const escaped = escapeNoIntroFilename(assetFileName);
  return {
    boxart: `${base}/Named_Boxarts/${escaped}`,
    screenshot: `${base}/Named_Snaps/${escaped}`,
    background: `${base}/Named_Snaps/${escaped}`,
  };
};

const getFilenameArtworkMap = (systemId: string): Record<string, string> => {
  if (systemId === 'nes') return NES_ROM_FILENAME_ARTWORK;
  if (systemId === 'snes') return SNES_ROM_FILENAME_ARTWORK;
  return {};
};

export const verifyArtworkUrl = async (url?: string): Promise<boolean> => {
  if (!url) return false;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/** Returns libretro-thumbnails URLs for box art and screenshots. */
export const getArtworkMappingForTitle = (title: string, systemId?: string): ArtworkMapping => {
  const system = systemId ? systemId.toLowerCase() : 'snes';

  if (system === 'snes') {
    return buildArtworkUrls(LIBRETRO_SNES_BASE, getNoIntroFilename(title, 'snes'));
  }

  if (system === 'nes') {
    const lookupKey = normalizeLookupKey(title);
    const hackFallback = HACK_ART_FALLBACKS[lookupKey];
    if (hackFallback) {
      return buildArtworkFromLibretroAsset(LIBRETRO_NES_BASE, hackFallback);
    }
    if (/\b(hack|romhack)\b/i.test(title)) {
      return {};
    }
    return buildArtworkUrls(LIBRETRO_NES_BASE, getNoIntroFilename(title, 'nes'));
  }

  return {};
};

/** Resolve artwork using display title, ROM filename, and hack fallbacks. */
export const getArtworkMappingForGame = (game: {
  title: string;
  systemId: string;
  originalFileName: string;
}): ArtworkMapping => {
  const filenameMap = getFilenameArtworkMap(game.systemId);
  const exactAsset = filenameMap[game.originalFileName];
  if (exactAsset) {
    const base = game.systemId === 'nes' ? LIBRETRO_NES_BASE : LIBRETRO_SNES_BASE;
    return buildArtworkFromLibretroAsset(base, exactAsset);
  }

  const fromTitle = getArtworkMappingForTitle(game.title, game.systemId);
  if (fromTitle.boxart) {
    return fromTitle;
  }

  const fromFileName = getArtworkMappingForTitle(
    romFileNameToDisplayTitle(game.originalFileName),
    game.systemId,
  );
  if (fromFileName.boxart) {
    return fromFileName;
  }

  return {};
};

/** Resolve artwork and verify the primary box art URL is reachable. */
export const resolveVerifiedArtworkForGame = async (game: {
  title: string;
  systemId: string;
  originalFileName: string;
}): Promise<{ artwork: ArtworkMapping; verified: boolean; source: 'filename' | 'title' | 'none' }> => {
  const artwork = getArtworkMappingForGame(game);
  if (!artwork.boxart) {
    return { artwork, verified: false, source: 'none' };
  }

  const filenameMap = getFilenameArtworkMap(game.systemId);
  const source = filenameMap[game.originalFileName] ? 'filename' : 'title';
  const verified = await verifyArtworkUrl(artwork.boxart);
  return { artwork, verified, source };
};
