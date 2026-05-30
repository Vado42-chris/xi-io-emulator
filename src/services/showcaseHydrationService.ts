import type { GameGenreId } from '../data/libraryFacets';
import type { GameRecord } from '../data/gameModels';
import {
  ARIES_NES_HACK_ROOT,
  ARIES_NES_ROM_ROOT,
  NES_SHOWCASE_CATALOG,
  NES_SHOWCASE_VERSION,
  type NesShowcaseEntry,
} from '../data/nesShowcaseCatalog';
import {
  ARIES_SNES_ROM_ROOT,
  SNES_SHOWCASE_CATALOG,
  SNES_SHOWCASE_VERSION,
  type SnesShowcaseEntry,
} from '../data/snesShowcaseCatalog';
import { getArtworkMappingForGame } from './artworkProvider';
import { validateGameIngress } from './ingressChecklistService';
import {
  addLedgerEvent,
  getGameRecords,
  saveGameRecord,
  saveLibraryRoot,
  type LibraryRoot,
} from './db';
import { checkPathExists, isTauriRuntime } from './tauriService';

type ShowcaseEntry = {
  displayTitle: string;
  fileName: string;
  genre: GameGenreId;
  year: number;
  players: string;
  region: 'usa' | 'europe' | 'japan';
  favorite?: boolean;
  hack?: boolean;
};

interface ShowcaseConfig {
  systemId: 'nes' | 'snes';
  version: string;
  flagKey: string;
  primaryRoot: string;
  hackRoot?: string;
  rootId: string;
  rootLabel: string;
  fileExtension: string;
  catalog: ShowcaseEntry[];
}

const SNES_CONFIG: ShowcaseConfig = {
  systemId: 'snes',
  version: SNES_SHOWCASE_VERSION,
  flagKey: 'xibalba_snes_showcase_hydrated',
  primaryRoot: ARIES_SNES_ROM_ROOT,
  rootId: 'root_snes_showcase_aries',
  rootLabel: 'SNES Showcase (Aries local)',
  fileExtension: '.smc',
  catalog: SNES_SHOWCASE_CATALOG,
};

const NES_CONFIG: ShowcaseConfig = {
  systemId: 'nes',
  version: NES_SHOWCASE_VERSION,
  flagKey: 'xibalba_nes_showcase_hydrated',
  primaryRoot: ARIES_NES_ROM_ROOT,
  hackRoot: ARIES_NES_HACK_ROOT,
  rootId: 'root_nes_showcase_aries',
  rootLabel: 'NES Showcase (Aries local USA + Hacks)',
  fileExtension: '.nes',
  catalog: NES_SHOWCASE_CATALOG,
};

export const isSnesShowcaseHydrated = (): boolean =>
  localStorage.getItem(SNES_CONFIG.flagKey) === SNES_SHOWCASE_VERSION;

export const isNesShowcaseHydrated = (): boolean =>
  localStorage.getItem(NES_CONFIG.flagKey) === NES_SHOWCASE_VERSION;

export interface ShowcaseHydrationResult {
  added: number;
  updated: number;
  skipped: number;
  missing: string[];
}

const joinRomPath = (fileName: string, root: string): string =>
  `${root.replace(/\/$/, '')}/${fileName}`;

const buildTags = (entry: ShowcaseEntry, systemId: 'nes' | 'snes'): string[] => {
  const tags = [
    `system:${systemId}`,
    'source:showcase_hydration',
    'showcase:ui',
    'identity:normalized',
    `genre:${entry.genre}`,
    `region:${entry.region}`,
    `year:${entry.year}`,
    `players:${entry.players}`,
  ];
  if (entry.hack) {
    tags.push('showcase:hack');
  }
  return tags;
};

const buildRecord = (
  entry: ShowcaseEntry,
  contentPath: string,
  rootId: string,
  systemId: 'nes' | 'snes',
  fileExtension: string,
  launchStatus: GameRecord['launchStatus'] = 'not_configured',
): GameRecord => {
  const now = new Date().toISOString();
  const sortTitle = entry.displayTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const id = `showcase_${systemId}_${entry.genre}_${sortTitle.replace(/\s+/g, '_').slice(0, 40)}`;

  return {
    id,
    systemId,
    ingressMode: 'batch_library',
    title: entry.displayTitle,
    sortTitle,
    originalFileName: entry.fileName,
    contentPath,
    fileExtension,
    identityStatus: 'normalized',
    launchStatus,
    favorite: entry.favorite ?? false,
    hidden: false,
    playCount: 0,
    tags: buildTags(entry, systemId),
    libraryRootId: rootId,
    mappings: {
      artwork: getArtworkMappingForGame({
        title: entry.displayTitle,
        systemId,
        originalFileName: entry.fileName,
      }),
    },
    createdAt: now,
    updatedAt: now,
  };
};

const ensureLibraryRoot = (config: ShowcaseConfig): string => {
  const now = new Date().toISOString();
  const root: LibraryRoot = {
    id: config.rootId,
    label: config.rootLabel,
    path: config.primaryRoot,
    systems: [config.systemId],
    mounted: true,
    createdAt: now,
    updatedAt: now,
  };
  saveLibraryRoot(root);
  return config.rootId;
};

const hydrateShowcase = async (
  config: ShowcaseConfig,
  options?: { force?: boolean },
): Promise<ShowcaseHydrationResult> => {
  if (!options?.force && localStorage.getItem(config.flagKey) === config.version) {
    return { added: 0, updated: 0, skipped: config.catalog.length, missing: [] };
  }

  addLedgerEvent(
    'showcase_hydration_started',
    `Hydrating ${config.systemId.toUpperCase()} UI showcase library from local ROM folder`,
    {
      root: config.primaryRoot,
      hackRoot: config.hackRoot,
      count: config.catalog.length,
    },
  );

  const rootId = ensureLibraryRoot(config);
  const existing = getGameRecords();
  const byPath = new Map(existing.map((g) => [g.contentPath, g]));

  let added = 0;
  let updated = 0;
  const skipped = 0;
  const missing: string[] = [];

  for (const entry of config.catalog) {
    const romRoot = entry.hack && config.hackRoot ? config.hackRoot : config.primaryRoot;
    const contentPath = joinRomPath(entry.fileName, romRoot);

    if (isTauriRuntime()) {
      const check = await checkPathExists(contentPath);
      if (!check.exists || !check.is_file) {
        missing.push(entry.fileName);
        addLedgerEvent('showcase_rom_missing', `Showcase ROM not found: ${entry.fileName}`, {
          contentPath,
          systemId: config.systemId,
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
        tags: Array.from(
          new Set([...prior.tags.filter((t) => !t.startsWith('genre:')), ...buildTags(entry, config.systemId)]),
        ),
        identityStatus: 'normalized',
        favorite: entry.favorite ?? prior.favorite,
        mappings: {
          ...prior.mappings,
          artwork: getArtworkMappingForGame({
            title: entry.displayTitle,
            systemId: config.systemId,
            originalFileName: entry.fileName,
          }),
        },
        updatedAt: new Date().toISOString(),
      };
      saveGameRecord(merged);
      byPath.set(contentPath, merged);
      const validated = await validateGameIngress(merged);
      byPath.set(contentPath, validated.game);
      updated += 1;
      continue;
    }

    const record = buildRecord(
      entry,
      contentPath,
      rootId,
      config.systemId,
      config.fileExtension,
    );
    saveGameRecord(record);
    const validated = await validateGameIngress(record);
    byPath.set(contentPath, validated.game);
    added += 1;
    addLedgerEvent('game_record_created', `Showcase game hydrated: ${entry.displayTitle}`, {
      gameId: validated.game.id,
      contentPath,
      systemId: config.systemId,
    });
  }

  localStorage.setItem(config.flagKey, config.version);
  addLedgerEvent(
    'showcase_hydration_completed',
    `${config.systemId.toUpperCase()} showcase hydration finished (${added} added, ${updated} updated)`,
    {
      added,
      updated,
      missing: missing.length,
      systemId: config.systemId,
    },
  );

  return { added, updated, skipped, missing };
};

/** Hand-picked SNES titles from the local Aries ROM folder — UI preview only, not bulk scan. */
export const hydrateSnesUiShowcase = (options?: { force?: boolean }): Promise<ShowcaseHydrationResult> =>
  hydrateShowcase(SNES_CONFIG, options);

/** Hand-picked NES USA + hack titles — UI preview only, not bulk scan. */
export const hydrateNesUiShowcase = (options?: { force?: boolean }): Promise<ShowcaseHydrationResult> =>
  hydrateShowcase(NES_CONFIG, options);

/** Hydrate all platform showcases (SNES + NES). */
export const hydrateAllUiShowcases = async (options?: {
  force?: boolean;
}): Promise<{ snes: ShowcaseHydrationResult; nes: ShowcaseHydrationResult }> => {
  const snes = await hydrateSnesUiShowcase(options);
  const nes = await hydrateNesUiShowcase(options);
  backfillShowcaseArtwork();
  return { snes, nes };
};

/** Refresh libretro artwork URLs for curated showcase titles (safe to run every startup). */
export const backfillShowcaseArtwork = (): { updated: number } => {
  const existing = getGameRecords();
  const byPath = new Map(existing.map((g) => [g.contentPath, g]));
  let updated = 0;

  for (const config of [SNES_CONFIG, NES_CONFIG]) {
    for (const entry of config.catalog) {
      const romRoot = entry.hack && config.hackRoot ? config.hackRoot : config.primaryRoot;
      const contentPath = joinRomPath(entry.fileName, romRoot);
      const game = byPath.get(contentPath);
      if (!game) {
        continue;
      }

      const artwork = getArtworkMappingForGame({
        title: entry.displayTitle,
        systemId: config.systemId,
        originalFileName: entry.fileName,
      });
      if (!artwork.boxart || artwork.boxart === game.mappings?.artwork?.boxart) {
        continue;
      }

      const merged: GameRecord = {
        ...game,
        mappings: {
          ...game.mappings,
          artwork,
        },
        updatedAt: new Date().toISOString(),
      };
      saveGameRecord(merged);
      byPath.set(contentPath, merged);
      updated += 1;
    }
  }

  return { updated };
};

export type { SnesShowcaseEntry, NesShowcaseEntry };
