import type { GameRecord, GameSearchDocument, DuplicateGroup, GameSearchFilters, GameSortOption } from '../data/gameModels';

/**
 * Builds a typed search document for a game record.
 * Generates a compiled searchText property containing key values for token search.
 */
export const buildGameSearchDocument = (game: GameRecord): GameSearchDocument => {
  const searchTextParts = [
    game.title,
    game.sortTitle,
    game.originalFileName,
    game.systemId,
    game.ingressMode,
    game.launchStatus,
    game.identityStatus,
    ...(game.tags || [])
  ];
  
  const searchText = searchTextParts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    gameId: game.id,
    title: game.title,
    sortTitle: game.sortTitle,
    normalizedTitle: game.sortTitle, // Using sortTitle as normalizedTitle
    originalFileName: game.originalFileName,
    systemId: game.systemId,
    tags: game.tags || [],
    ingressMode: game.ingressMode,
    launchStatus: game.launchStatus,
    identityStatus: game.identityStatus,
    favorite: game.favorite,
    hidden: game.hidden,
    hasCheats: game.hasCheats ?? false,
    hasPatches: game.hasPatches ?? false,
    hasHacks: game.hasHacks ?? false,
    lastPlayedAt: game.lastPlayedAt,
    playCount: game.playCount ?? 0,
    createdAt: game.createdAt,
    searchText
  };
};

/**
 * Maps a list of game records to search documents.
 */
export const buildGameSearchIndex = (games: GameRecord[]): GameSearchDocument[] => {
  return games.map(buildGameSearchDocument);
};

/**
 * Advisory duplicate detection rule.
 * Groups games by normalizedTitle (sortTitle) + systemId.
 */
export const detectDuplicateCandidates = (games: GameRecord[]): DuplicateGroup[] => {
  const groups: { [key: string]: GameRecord[] } = {};
  
  games.forEach(game => {
    const key = `${game.systemId}::${game.sortTitle.trim()}`.toLowerCase();
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(game);
  });
  
  const duplicateGroups: DuplicateGroup[] = [];
  
  Object.entries(groups).forEach(([key, groupGames]) => {
    if (groupGames.length > 1) {
      const sortedGames = [...groupGames].sort((a, b) => a.id.localeCompare(b.id));
      const gameIds = sortedGames.map(g => g.id);
      
      duplicateGroups.push({
        id: `dup_${key.replace(/[^a-z0-9]/gi, '_')}`,
        reason: 'same_normalized_title',
        canonicalGameId: gameIds[0],
        gameIds,
        confidence: 'strong',
        recommendation: `Multiple copies of "${sortedGames[0].title}" found for ${sortedGames[0].systemId.toUpperCase()}. Consider keeping only one active or resolve path configurations.`,
        resolved: false
      });
    }
  });
  
  return duplicateGroups;
};

/**
 * Filter game search documents based on active search options.
 */
export const filterGameSearchDocuments = (
  docs: GameSearchDocument[],
  filters: GameSearchFilters,
  duplicateGroups: DuplicateGroup[] = []
): GameSearchDocument[] => {
  const duplicateGameIds = new Set<string>();
  if (filters.isDuplicate) {
    duplicateGroups.forEach(group => {
      group.gameIds.forEach(id => duplicateGameIds.add(id));
    });
  }

  return docs.filter(doc => {
    // 1. System Filter
    if (filters.systemId && filters.systemId !== 'all' && doc.systemId !== filters.systemId) {
      return false;
    }

    // 2. Ingress Mode Filter
    if (filters.ingressMode && doc.ingressMode !== filters.ingressMode) {
      return false;
    }

    // 3. Launch Status Filter
    if (filters.launchStatus && filters.launchStatus !== 'all' && doc.launchStatus !== filters.launchStatus) {
      return false;
    }

    // 4. Identity Status Filter
    if (filters.identityStatus && filters.identityStatus !== 'all' && doc.identityStatus !== filters.identityStatus) {
      return false;
    }

    // 5. Favorite Filter
    if (typeof filters.favorite === 'boolean' && doc.favorite !== filters.favorite) {
      return false;
    }

    // 6. Hidden Filter
    if (typeof filters.hidden === 'boolean' && doc.hidden !== filters.hidden) {
      return false;
    }

    // 7. Needs Config Filter
    if (filters.needsConfig && doc.launchStatus !== 'not_configured') {
      return false;
    }

    // 8. Duplicate Filter
    if (filters.isDuplicate && !duplicateGameIds.has(doc.gameId)) {
      return false;
    }

    // 9. Has Cheats Filter
    if (typeof filters.hasCheats === 'boolean' && doc.hasCheats !== filters.hasCheats) {
      return false;
    }

    // 10. Has Patches Filter
    if (typeof filters.hasPatches === 'boolean' && doc.hasPatches !== filters.hasPatches) {
      return false;
    }

    // 11. Has Hacks Filter
    if (typeof filters.hasHacks === 'boolean' && doc.hasHacks !== filters.hasHacks) {
      return false;
    }

    // 12. Search Query Multi-word matching
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const words = filters.searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      const matchesSearch = words.every(word => doc.searchText.includes(word));
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sorts game search documents by option, falling back to title alphabetically.
 */
export const sortGameSearchDocuments = (
  docs: GameSearchDocument[],
  option: GameSortOption
): GameSearchDocument[] => {
  const getLaunchStatusPriority = (status: string): number => {
    switch (status) {
      case 'ready': return 1;
      case 'not_configured': return 2;
      case 'blocked': return 3;
      default: return 4;
    }
  };

  return [...docs].sort((a, b) => {
    let comparison = 0;

    switch (option) {
      case 'recently_added': {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = timeB - timeA; // Descending (newest first)
        break;
      }
      case 'recently_played': {
        const timeA = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
        const timeB = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
        comparison = timeB - timeA; // Descending (most recently played first)
        break;
      }
      case 'play_count': {
        comparison = b.playCount - a.playCount; // Descending (highest first)
        break;
      }
      case 'launch_status': {
        comparison = getLaunchStatusPriority(a.launchStatus) - getLaunchStatusPriority(b.launchStatus);
        break;
      }
      case 'title':
      default:
        break;
    }

    if (comparison === 0) {
      return a.title.localeCompare(b.title);
    }
    
    return comparison;
  });
};
