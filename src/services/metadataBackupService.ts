/**
 * Metadata-only library backup (XARCADE-LIBRARY-METADATA-BACKUP-001).
 *
 * Exports game records and library roots without absolute paths or ROM bytes.
 * Git push / Admin UI wiring is a separate slice — this module builds the bundle.
 */
import type { GameRecord } from '../data/gameModels';
import { addLedgerEvent, getGameRecords, getLibraryRoots, type LibraryRoot } from './db';

export const METADATA_BACKUP_SCHEMA_VERSION = '1.0.0';

export interface MetadataBackupRoot {
  id: string;
  label: string;
  systems: string[];
  mounted: boolean;
  readOnlySource: boolean;
  volumeHint?: string;
  lastSeenAt?: string;
}

export interface MetadataBackupGame {
  id: string;
  systemId: string;
  title: string;
  sortTitle: string;
  originalFileName: string;
  relativePath: string;
  fileExtension: string;
  libraryRootId: string;
  identityStatus: GameRecord['identityStatus'];
  launchStatus: GameRecord['launchStatus'];
  favorite: boolean;
  hidden: boolean;
  playCount: number;
  tags: string[];
  dataSource: string;
  provenanceLabel: string;
  reviewStatus: 'approved' | 'needs_review' | 'rejected';
  mappings?: GameRecord['mappings'];
  ingressChecklist?: GameRecord['ingressChecklist'];
  lastPlayedAt?: string;
  checksum?: string;
  fileSizeBytes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MetadataBackupBundle {
  schemaVersion: string;
  exportId: string;
  exportedAt: string;
  sourceApp: {
    name: string;
    version: string;
    branch?: string;
  };
  libraryRoots: MetadataBackupRoot[];
  games: MetadataBackupGame[];
}

const ABSOLUTE_PATH_PATTERN = /^(\/|[A-Za-z]:\\|\\\\)/;

export const isAbsolutePath = (value: string): boolean => ABSOLUTE_PATH_PATTERN.test(value.trim());

export const toRelativePath = (contentPath: string, rootPath: string): string => {
  const normalizedRoot = rootPath.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedContent = contentPath.replace(/\\/g, '/');
  if (normalizedContent.startsWith(`${normalizedRoot}/`)) {
    return normalizedContent.slice(normalizedRoot.length + 1);
  }
  const fileName = normalizedContent.split('/').pop();
  return fileName ?? normalizedContent;
};

const inferDataSource = (game: GameRecord): string => {
  if (game.tags.includes('source:showcase_hydration')) {
    return 'showcase_fixture';
  }
  if (game.ingressMode === 'batch_library') {
    return 'batch_library';
  }
  return 'single_ingress';
};

const inferProvenanceLabel = (game: GameRecord): string => {
  if (game.tags.includes('source:showcase_hydration')) {
    return 'Curated showcase — not bulk import';
  }
  return 'Exported from xi-io local catalog';
};

export const exportLibraryRoot = (root: LibraryRoot): MetadataBackupRoot => ({
  id: root.id,
  label: root.label,
  systems: root.systems,
  mounted: root.mounted,
  readOnlySource: true,
  volumeHint: root.expectedDevice,
  lastSeenAt: root.lastSeenAt,
});

export const exportGameRecord = (
  game: GameRecord,
  rootsById: Map<string, LibraryRoot>,
): MetadataBackupGame | null => {
  const rootId = game.libraryRootId;
  if (!rootId) {
    return null;
  }
  const root = rootsById.get(rootId);
  if (!root) {
    return null;
  }

  const relativePath = toRelativePath(game.contentPath, root.path);
  if (isAbsolutePath(relativePath)) {
    return null;
  }

  return {
    id: game.id,
    systemId: game.systemId,
    title: game.title,
    sortTitle: game.sortTitle,
    originalFileName: game.originalFileName,
    relativePath,
    fileExtension: game.fileExtension,
    libraryRootId: rootId,
    identityStatus: game.identityStatus,
    launchStatus: game.launchStatus,
    favorite: game.favorite,
    hidden: game.hidden,
    playCount: game.playCount,
    tags: game.tags,
    dataSource: inferDataSource(game),
    provenanceLabel: inferProvenanceLabel(game),
    reviewStatus: 'needs_review',
    mappings: game.mappings,
    ingressChecklist: game.ingressChecklist,
    lastPlayedAt: game.lastPlayedAt,
    checksum: game.checksum,
    fileSizeBytes: game.fileSizeBytes,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
};

export interface BuildMetadataBackupOptions {
  exportId?: string;
  maxGames?: number;
  gameIds?: string[];
  emitLedger?: boolean;
}

export interface BuildMetadataBackupResult {
  bundle: MetadataBackupBundle;
  exportedCount: number;
  skippedNoRoot: number;
  excludedByFilter: number;
}

/** Build a metadata-only backup bundle from the current local catalog. */
export const buildMetadataBackupBundle = (
  options?: BuildMetadataBackupOptions,
): BuildMetadataBackupResult => {
  const roots = getLibraryRoots();
  const rootsById = new Map(roots.map((root) => [root.id, root]));
  const selectedIds = options?.gameIds ? new Set(options.gameIds) : null;
  const maxGames = options?.maxGames;

  const allGames = getGameRecords();
  const exportedRoots = roots.map(exportLibraryRoot);
  const games: MetadataBackupGame[] = [];
  let skippedNoRoot = 0;
  let excludedByFilter = 0;

  for (const game of allGames) {
    if (selectedIds && !selectedIds.has(game.id)) {
      excludedByFilter += 1;
      continue;
    }
    if (maxGames !== undefined && games.length >= maxGames) {
      break;
    }
    const exported = exportGameRecord(game, rootsById);
    if (!exported) {
      skippedNoRoot += 1;
      continue;
    }
    games.push(exported);
  }

  const bundle: MetadataBackupBundle = {
    schemaVersion: METADATA_BACKUP_SCHEMA_VERSION,
    exportId: options?.exportId ?? `export-${Date.now()}`,
    exportedAt: new Date().toISOString(),
    sourceApp: {
      name: 'xi-io-emulator',
      version: '0.0.0',
    },
    libraryRoots: exportedRoots,
    games,
  };

  const result: BuildMetadataBackupResult = {
    bundle,
    exportedCount: games.length,
    skippedNoRoot,
    excludedByFilter,
  };

  if (options?.emitLedger !== false) {
    addLedgerEvent(
      'metadata_backup_export_built',
      `Metadata backup bundle built (${games.length} games, ${skippedNoRoot} skipped no root)`,
      {
        exportId: bundle.exportId,
        gameCount: games.length,
        rootCount: exportedRoots.length,
        skippedNoRoot,
        excludedByFilter,
        schemaVersion: METADATA_BACKUP_SCHEMA_VERSION,
      },
    );
  }

  return result;
};
