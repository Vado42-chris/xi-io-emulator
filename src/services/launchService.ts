import type { GameRecord } from '../data/gameModels';
import { getLibraryRoots, getEngineSettings, addLedgerEvent } from './db';

export interface LaunchBlocker {
  code: 'missing_drive' | 'permission_denied' | 'missing_engine' | 'missing_core';
  title: string;
  desc: string;
}

export interface LaunchReadiness {
  ready: boolean;
  blockers: LaunchBlocker[];
}

export interface LaunchResult {
  success: boolean;
  command: string;
  error?: string;
}

/**
 * Validates storage connectivity, permission access, and emulator configuration for a game.
 */
export const checkLaunchReadiness = (game: GameRecord): LaunchReadiness => {
  const blockers: LaunchBlocker[] = [];
  
  // 1. Check storage settings for batch library games
  if (game.ingressMode === 'batch_library' && game.libraryRootId) {
    const roots = getLibraryRoots();
    const root = roots.find((r) => r.id === game.libraryRootId);
    if (!root) {
      blockers.push({
        code: 'missing_drive',
        title: 'Storage Volume Unregistered',
        desc: 'The storage directory containing this game is no longer registered. Please re-register or select a new library path.',
      });
    } else if (!root.mounted) {
      blockers.push({
        code: 'missing_drive',
        title: 'Offline Storage Volume',
        desc: `The storage volume '${root.label}' containing this game is offline. Please mount the volume or check connection.`,
      });
    } else if (root.permissionDenied) {
      blockers.push({
        code: 'permission_denied',
        title: 'Access Permission Denied',
        desc: `Permission denied for volume '${root.label}'. Xibalba Emulator does not have access permissions. Run the Flatpak override if using sandbox mode.`,
      });
    }
  }

  // 2. Check engine configuration (RetroArch binary & core path)
  const engine = getEngineSettings();
  if (!engine.retroarchBinaryPath || engine.retroarchBinaryPath === 'Not set') {
    blockers.push({
      code: 'missing_engine',
      title: 'Missing RetroArch Executable',
      desc: 'RetroArch binary path is not configured. Please open Admin Console -> Emulator Engines and locate your RetroArch executable.',
    });
  }
  if (!engine.snesCorePath || engine.snesCorePath === 'Not set') {
    blockers.push({
      code: 'missing_core',
      title: 'Missing libretro Core',
      desc: 'Super Nintendo core adapter path is not configured. Please open Admin Console -> Emulator Engines and configure the SNES core path.',
    });
  }

  return {
    ready: blockers.length === 0,
    blockers,
  };
};

/**
 * Simulates a game launch command execution, adding events to the ledger.
 */
export const simulateLaunchGame = (game: GameRecord): LaunchResult => {
  const readiness = checkLaunchReadiness(game);
  if (!readiness.ready) {
    const firstBlocker = readiness.blockers[0];
    addLedgerEvent('launch_failed', `Launch aborted for ${game.title}: ${firstBlocker.title}`, {
      gameId: game.id,
      blockerCode: firstBlocker.code,
    });
    return {
      success: false,
      command: '',
      error: firstBlocker.desc,
    };
  }

  const engine = getEngineSettings();
  const command = `${engine.retroarchBinaryPath} -f -L ${engine.snesCorePath} "${game.contentPath}"`;
  
  addLedgerEvent('launch_game', `Starting game playback: ${game.title}`, {
    gameId: game.id,
    title: game.title,
    command,
  });

  return {
    success: true,
    command,
  };
};
