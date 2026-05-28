import type { GameRecord } from '../data/gameModels';
import { saveGameRecord, addLedgerEvent, getGameRecords, type LibraryRoot, saveLibraryRoot } from './db';

// Helper to normalize game title from file name
export const normalizeTitle = (fileName: string): { title: string; sortTitle: string; extension: string } => {
  // Get the base filename by stripping paths
  const base = fileName.split('/').pop() || fileName;
  
  // Extract extension
  const dotIndex = base.lastIndexOf('.');
  let title = base;
  let extension = '';
  
  if (dotIndex >= 0) {
    title = base.substring(0, dotIndex);
    extension = base.substring(dotIndex);
  }
  
  // Normalize title
  title = title.replace(/_/g, ' ').trim();
  const sortTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  
  return { title, sortTitle, extension };
};

// Check if file is a supported SNES ROM extension
export const isSupportedSNES = (extension: string): boolean => {
  const ext = extension.toLowerCase();
  return ext === '.sfc' || ext === '.smc';
};

// Ingress a single game
export const ingressSingleGame = async (
  originalFileName: string,
  contentPath: string,
  fileSizeBytes?: number
): Promise<GameRecord> => {
  addLedgerEvent('single_game_ingress_started', `Starting ingress for single game: ${originalFileName}`);
  
  const { title, sortTitle, extension } = normalizeTitle(originalFileName);
  
  if (!isSupportedSNES(extension)) {
    const errorMsg = `Unsupported file extension "${extension}". Only .sfc and .smc are supported.`;
    addLedgerEvent('single_game_ingress_failed', errorMsg, { originalFileName });
    throw new Error(errorMsg);
  }

  const id = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const tags = [
    'system:snes',
    'source:single_game',
    'identity:raw',
    'launch:not_configured'
  ];

  const record: GameRecord = {
    id,
    systemId: 'snes',
    ingressMode: 'single_game',
    title,
    sortTitle,
    originalFileName,
    contentPath,
    fileExtension: extension,
    fileSizeBytes,
    identityStatus: 'raw',
    launchStatus: 'not_configured',
    favorite: false,
    hidden: false,
    playCount: 0,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveGameRecord(record);
  addLedgerEvent('game_record_created', `Game record created for "${title}"`, { gameId: id, mode: 'single_game' });
  tags.forEach(tag => {
    addLedgerEvent('game_tag_added', `Tag "${tag}" added to game "${title}"`, { gameId: id, tag });
  });
  
  addLedgerEvent('single_game_ingress_completed', `Successfully ingressed single game: "${title}"`);
  return record;
};

// Ingress a batch of games from a library folder
export const ingressBatchFolder = async (
  folderPath: string,
  mockFiles: { name: string; sizeBytes?: number }[]
): Promise<GameRecord[]> => {
  addLedgerEvent('batch_library_ingress_started', `Starting folder scan on: ${folderPath}`);
  
  if (!folderPath.trim()) {
    const errorMsg = 'Invalid folder path provided';
    addLedgerEvent('batch_library_ingress_failed', errorMsg);
    throw new Error(errorMsg);
  }

  // Create or retrieve library root record
  const rootId = `root_${Date.now()}`;
  const libraryRoot: LibraryRoot = {
    id: rootId,
    label: folderPath.split('/').pop() || 'SNES Library',
    path: folderPath,
    systems: ['snes'],
    mounted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveLibraryRoot(libraryRoot);
  addLedgerEvent('library_root_added', `Library root directory registered: ${folderPath}`, { rootId });

  const addedRecords: GameRecord[] = [];
  
  for (const file of mockFiles) {
    const { title, sortTitle, extension } = normalizeTitle(file.name);
    
    if (!isSupportedSNES(extension)) {
      addLedgerEvent('rom_skipped', `Skipping unsupported file "${file.name}"`, { path: folderPath + '/' + file.name });
      continue;
    }

    // Check duplicate path
    const existing = getGameRecords();
    const isDuplicate = existing.some(r => r.contentPath === folderPath + '/' + file.name);
    
    if (isDuplicate) {
      addLedgerEvent('duplicate_rom_detected', `Duplicate ROM path detected: "${file.name}"`, { path: folderPath + '/' + file.name });
      continue;
    }

    const id = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${addedRecords.length}`;
    
    const tags = [
      'system:snes',
      'source:batch_library',
      'identity:raw',
      'launch:not_configured'
    ];

    const record: GameRecord = {
      id,
      systemId: 'snes',
      ingressMode: 'batch_library',
      title,
      sortTitle,
      originalFileName: file.name,
      contentPath: folderPath + (folderPath.endsWith('/') ? '' : '/') + file.name,
      fileExtension: extension,
      fileSizeBytes: file.sizeBytes,
      identityStatus: 'raw',
      launchStatus: 'not_configured',
      favorite: false,
      hidden: false,
      playCount: 0,
      tags,
      libraryRootId: rootId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveGameRecord(record);
    addedRecords.push(record);
    
    addLedgerEvent('game_record_created', `Game record created for "${title}" in batch`, { gameId: id, mode: 'batch_library' });
    tags.forEach(tag => {
      addLedgerEvent('game_tag_added', `Tag "${tag}" added to game "${title}"`, { gameId: id, tag });
    });
  }

  addLedgerEvent('batch_library_ingress_completed', `Completed folder scan. Added ${addedRecords.length} game records.`, { rootId });
  return addedRecords;
};
