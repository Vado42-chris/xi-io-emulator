import type { GameRecord } from '../data/gameModels';
import type { GameGenreId } from '../data/libraryFacets';
import {
  buildGameSearchIndex,
  detectDuplicateCandidates,
  filterGameSearchDocuments,
} from './searchService';

export type ArcadeFacetFilter =
  | 'all'
  | 'favorites'
  | 'needs_config'
  | 'showcase'
  | `genre:${GameGenreId}`;

export interface ArcadePlatformTab {
  id: string;
  label: string;
  count: number;
}

/** Platforms shown in the arcade selector — extend as new systems are supported. */
export const ARCADE_PLATFORM_ORDER = ['snes', 'nes', 'n64', 'gba', 'gbc', 'gb', 'genesis', 'ps1'] as const;

const PLATFORM_LABELS: Record<string, string> = {
  snes: 'SNES',
  nes: 'NES',
  n64: 'N64',
  gba: 'GBA',
  gbc: 'GBC',
  gb: 'Game Boy',
  genesis: 'Genesis',
  ps1: 'PlayStation',
};

export function platformLabel(systemId: string): string {
  return PLATFORM_LABELS[systemId] ?? systemId.toUpperCase();
}

export function deriveArcadePlatformTabs(games: GameRecord[]): ArcadePlatformTab[] {
  const visible = games.filter((g) => !g.hidden);
  const counts = new Map<string, number>();
  for (const game of visible) {
    counts.set(game.systemId, (counts.get(game.systemId) ?? 0) + 1);
  }

  const tabs: ArcadePlatformTab[] = [
    { id: 'all', label: 'All Platforms', count: visible.length },
  ];

  const seen = new Set<string>();
  for (const systemId of ARCADE_PLATFORM_ORDER) {
    seen.add(systemId);
    tabs.push({
      id: systemId,
      label: platformLabel(systemId),
      count: counts.get(systemId) ?? 0,
    });
  }

  for (const [systemId, count] of counts) {
    if (!seen.has(systemId)) {
      tabs.push({ id: systemId, label: platformLabel(systemId), count });
    }
  }

  return tabs;
}

export function filterArcadeCatalog(
  games: GameRecord[],
  platformId: string,
  facet: ArcadeFacetFilter,
  searchQuery: string,
): GameRecord[] {
  const duplicateGroups = detectDuplicateCandidates(games);
  const docs = filterGameSearchDocuments(
    buildGameSearchIndex(games),
    {
      systemId: platformId,
      hidden: false,
      searchQuery: searchQuery.trim() || undefined,
      favorite: facet === 'favorites' ? true : undefined,
      needsConfig: facet === 'needs_config' ? true : undefined,
    },
    duplicateGroups,
  );

  let filteredDocs = docs;
  if (facet === 'showcase') {
    filteredDocs = docs.filter((doc) => doc.tags.includes('showcase:ui'));
  } else if (facet.startsWith('genre:')) {
    const tag = facet;
    filteredDocs = docs.filter((doc) => doc.tags.includes(tag));
  }

  const ids = new Set(filteredDocs.map((doc) => doc.gameId));
  return games.filter((game) => ids.has(game.id));
}
