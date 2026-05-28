export type IngressMode = 'single_game' | 'batch_library';

export type GameIdentityStatus = 'raw' | 'normalized';

export type GameLaunchStatus = 'not_configured' | 'ready' | 'blocked';

export type GameTag = string;

export interface ArtworkMapping {
  boxart?: string;
  screenshot?: string;
  background?: string;
}

export interface GuideMapping {
  textGuidePath?: string;
  wikiUrl?: string;
}

export interface GameMappings {
  artwork?: ArtworkMapping;
  guide?: GuideMapping;
}

export interface GameLaunchReadiness {
  ready: boolean;
  blockers: string[];
}

export interface GameRecord {
  id: string;
  systemId: string;
  ingressMode: IngressMode;
  title: string;
  sortTitle: string;
  originalFileName: string;
  contentPath: string;
  fileExtension: string;
  fileSizeBytes?: number;
  checksum?: string;
  identityStatus: GameIdentityStatus;
  launchStatus: GameLaunchStatus;
  favorite: boolean;
  hidden: boolean;
  playCount: number;
  tags: GameTag[];
  libraryRootId?: string;
  mappings?: GameMappings;
  lastPlayedAt?: string;
  hasCheats?: boolean;
  hasPatches?: boolean;
  hasHacks?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GameSearchDocument {
  gameId: string;
  title: string;
  sortTitle: string;
  normalizedTitle: string;
  originalFileName: string;
  systemId: string;
  tags: string[];
  ingressMode: IngressMode;
  launchStatus: string;
  identityStatus: string;
  favorite: boolean;
  hidden: boolean;
  hasCheats: boolean;
  hasPatches: boolean;
  hasHacks: boolean;
  lastPlayedAt?: string;
  playCount: number;
  createdAt?: string;
  searchText: string;
}

export interface DuplicateGroup {
  id: string;
  reason: 'same_normalized_title' | 'same_checksum' | 'same_provider_match' | 'same_parent_clone_group';
  canonicalGameId?: string;
  gameIds: string[];
  confidence: 'exact' | 'strong' | 'possible';
  recommendation?: string;
  resolved: boolean;
}

export interface GameSearchFilters {
  systemId?: string;
  ingressMode?: IngressMode;
  launchStatus?: string;
  identityStatus?: string;
  favorite?: boolean;
  hidden?: boolean;
  needsConfig?: boolean;
  isDuplicate?: boolean;
  hasCheats?: boolean;
  hasPatches?: boolean;
  hasHacks?: boolean;
  searchQuery?: string;
}

export type GameSortOption = 
  | 'title' 
  | 'recently_added' 
  | 'recently_played' 
  | 'play_count' 
  | 'launch_status';
