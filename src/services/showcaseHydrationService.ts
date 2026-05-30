import type { GameRecord } from '../data/gameModels';
import {
  ARIES_SNES_ROM_ROOT,
  SNES_SHOWCASE_CATALOG,
  SNES_SHOWCASE_VERSION,
  type SnesShowcaseEntry,
} from '../data/snesShowcaseCatalog';
import { getArtworkMappingForTitle } from './artworkProvider';
import {
  addLedgerEvent,
  getGameRecords,
  saveGameRecord,
  saveLibraryRoot,
  type LibraryRoot,
} from './db';
import { checkPathExists, isTauriRuntime } from './tauriService';

const HYDRATION_FLAG_KEY = 'xibalba_snes_showcase_hydrated';

export const isSnesShowcaseHydrated = (): boolean =>
  localStorage.getItem(HYDRATION_FLAG_KEY) === SNES_SHOWCASE_VERSION;

const joinRomPath = (fileName: string, root = ARIES_SNES_ROM_ROOT): string =>
  `${root.replace(/\/$/, '')}/${fileName}`;

const buildTags = (entry: SnesShowcaseEntry): string[] => [
  'system:snes',
  'source:showcase_hydration',
  'showcase:ui',
  'identity:normalized',
  `genre:${entry.genre}`,
  `region:${entry.region}`,
  `year:${entry.year}`,
  `players:${entry.players}`,
];

const buildRecord = (
  entry: SnesShowcaseEntry,
  contentPath: string,
  rootId: string,
  launchStatus: GameRecord['launchStatus'] = 'not_configured'
): GameRecord => {
  const now = new Date().toISOString();
  const sortTitle = entry.displayTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const id = `showcase_snes_${entry.genre}_${sortTitle.replace(/\s+/g, '_').slice(0, 40)}`;

  return {
    id,
    systemId: 'snes',
    ingressMode: 'batch_library',
    title: entry.displayTitle,
    sortTitle,
    originalFileName: entry.fileName,
    contentPath,
    fileExtension: '.smc',
    identityStatus: 'normalized',
    launchStatus,
    favorite: entry.favorite ?? false,
    hidden: false,
    playCount: 0,
    tags: buildTags(entry),
    libraryRootId: rootId,
    mappings: {
      artwork: getArtworkMappingForTitle(entry.displayTitle, 'snes'),
    },
    createdAt: now,
    updatedAt: now,
  };
};

const ensureLibraryRoot = (): string => {
  const rootId = 'root_snes_showcase_aries';

  const now = new Date().toISOString();
  const root: LibraryRoot = {
    id: rootId,
    label: 'SNES Showcase (Aries local)',
    path: ARIES_SNES_ROM_ROOT,
    systems: ['snes'],
    mounted: true,
    createdAt: now,
    updatedAt: now,
  };
  saveLibraryRoot(root);
  return rootId;
};

export interface ShowcaseHydrationResult {
  added: number;
  updated: number;
  skipped: number;
  missing: string[];
}

/** Hand-picked SNES titles from the local Aries ROM folder — UI preview only, not bulk scan. */
export const hydrateSnesUiShowcase = async (options?: {
  force?: boolean;
}): Promise<ShowcaseHydrationResult> => {
  if (!options?.force && isSnesShowcaseHydrated()) {
    return { added: 0, updated: 0, skipped: SNES_SHOWCASE_CATALOG.length, missing: [] };
  }

  addLedgerEvent('showcase_hydration_started', 'Hydrating SNES UI showcase library from local ROM folder', {
    root: ARIES_SNES_ROM_ROOT,
    count: SNES_SHOWCASE_CATALOG.length,
  });

  const rootId = ensureLibraryRoot();
  const existing = getGameRecords();
  const byPath = new Map(existing.map((g) => [g.contentPath, g]));

  let added = 0;
  let updated = 0;
  let skipped = 0;
  const missing: string[] = [];

  for (const entry of SNES_SHOWCASE_CATALOG) {
    const contentPath = joinRomPath(entry.fileName);

    if (isTauriRuntime()) {
      const check = await checkPathExists(contentPath);
      if (!check.exists || !check.is_file) {
        missing.push(entry.fileName);
        addLedgerEvent('showcase_rom_missing', `Showcase ROM not found: ${entry.fileName}`, {
          contentPath,
        });
        continue;
      }
    }

    const prior = byPath.get(contentPath);
    if (prior) {
      const merged: GameRecord = {
        ...prior,
        title: entry.displayTitle,
        sortTitle: entry.displayTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(),
        tags: Array.from(new Set([...prior.tags.filter((t) => !t.startsWith('genre:')), ...buildTags(entry)])),
        identityStatus: 'normalized',
        favorite: entry.favorite ?? prior.favorite,
        mappings: {
          ...prior.mappings,
          artwork: getArtworkMappingForTitle(entry.displayTitle, 'snes'),
        },
        updatedAt: new Date().toISOString(),
      };
      saveGameRecord(merged);
      byPath.set(contentPath, merged);
      updated += 1;
      continue;
    }

    const record = buildRecord(entry, contentPath, rootId);
    saveGameRecord(record);
    byPath.set(contentPath, record);
    added += 1;
    addLedgerEvent('game_record_created', `Showcase game hydrated: ${entry.displayTitle}`, {
      gameId: record.id,
      contentPath,
    });
  }

  localStorage.setItem(HYDRATION_FLAG_KEY, SNES_SHOWCASE_VERSION);
  addLedgerEvent('showcase_hydration_completed', `SNES showcase hydration finished (${added} added, ${updated} updated)`, {
    added,
    updated,
    missing: missing.length,
  });

  return { added, updated, skipped, missing };
};
