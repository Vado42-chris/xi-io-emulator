import type { ArtworkMapping } from '../data/gameModels';

// Base URL for the official SNES libretro-thumbnails repository
const LIBRETRO_SNES_BASE = 'https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Super_Nintendo_Entertainment_System/master';

// Specific No-Intro naming mappings for the initial/mock SNES library
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
  'earthbound': 'EarthBound (USA)',
  'secret of mana': 'Secret of Mana (USA)',
  'star fox': 'Star Fox (USA)',
  'contra iii the alien wars': 'Contra III - The Alien Wars (USA)',
  'contra iii: the alien wars': 'Contra III - The Alien Wars (USA)',
  'nba jam': 'NBA Jam (USA)',
  'tetris attack': 'Tetris Attack (USA)',
  'pilotwings': 'Pilotwings (USA)',
  'killer instinct': 'Killer Instinct (USA)',
};

/**
 * Escapes the filename for safe use in GitHub raw content URLs,
 * matching how libretro-thumbnails files are retrieved.
 * E.g., spaces to %20, comma to %2C, but keeps parentheses ( and ) intact.
 */
const escapeNoIntroFilename = (filename: string): string => {
  return encodeURIComponent(filename)
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%2C/g, ',')
    .replace(/%26/g, '&');
};

/**
 * Parses and maps a game title to its corresponding Libretro No-Intro filename convention.
 */
export const getNoIntroFilename = (title: string): string => {
  let cleanTitle = title.trim();

  // Strip file extension if present in title
  if (cleanTitle.toLowerCase().endsWith('.sfc') || cleanTitle.toLowerCase().endsWith('.smc')) {
    cleanTitle = cleanTitle.substring(0, cleanTitle.lastIndexOf('.'));
  }

  // Normalize spaces and underscores
  cleanTitle = cleanTitle.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

  // Strip region suffixes from lookup check
  // E.g. "Super Mario Kart (USA)" -> "super mario kart"
  let lookupKey = cleanTitle.toLowerCase();
  
  // Remove common region/dump tags from the lookup key
  lookupKey = lookupKey
    .replace(/\s*\(usa\)/i, '')
    .replace(/\s*\(europe\)/i, '')
    .replace(/\s*\(japan\)/i, '')
    .replace(/\s*\(en,ja\)/i, '')
    .replace(/\s*\(japan, usa\)/i, '')
    .trim();

  // Check if we have an explicit No-Intro mapping
  if (SNES_SPECIAL_MAPPINGS[lookupKey]) {
    return SNES_SPECIAL_MAPPINGS[lookupKey];
  }

  // Dynamic fallback heuristics for other games (e.g. user personal collections)
  let resolvedName = cleanTitle;

  // 1. Move "The " from start of the game to ", The" end if it matches No-Intro style
  if (resolvedName.toLowerCase().startsWith('the ')) {
    const mainTitle = resolvedName.substring(4);
    // Only apply if the title doesn't already have parentheses or is a special case
    if (!mainTitle.includes(',')) {
      resolvedName = `${mainTitle}, The`;
    }
  }

  // 2. Replace colons with dashes which is common in No-Intro filenames
  resolvedName = resolvedName.replace(/:/g, ' -');

  // 3. Ensure a region tag is present in the resolved filename
  const hasRegion = /\((usa|europe|japan|world|canada|france|germany|italy|spain|australia)/i.test(resolvedName);
  if (!hasRegion) {
    resolvedName = `${resolvedName} (USA)`;
  }

  // Normalize spacing once more
  resolvedName = resolvedName.replace(/\s+/g, ' ').trim();

  return resolvedName;
};

/**
 * Returns the ArtworkMapping urls (boxart, screenshot, background) for a given game title.
 */
export const getArtworkMappingForTitle = (title: string, systemId?: string): ArtworkMapping => {
  // Currently we only support Nintendo SNES, but we can expand for other systems later
  const system = systemId ? systemId.toLowerCase() : 'snes';
  
  if (system !== 'snes') {
    return {};
  }

  const filename = getNoIntroFilename(title);
  const escapedFilename = escapeNoIntroFilename(filename);

  return {
    boxart: `${LIBRETRO_SNES_BASE}/Named_Boxarts/${escapedFilename}.png`,
    screenshot: `${LIBRETRO_SNES_BASE}/Named_Snaps/${escapedFilename}.png`,
    background: `${LIBRETRO_SNES_BASE}/Named_Snaps/${escapedFilename}.png`
  };
};
