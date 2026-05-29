import type { GameRecord } from '../data/gameModels';
import { getLibraryRoots, getEngineSettings, addLedgerEvent, getProofGameSettings, saveProofGameSettings } from './db';
import { ingressSingleGame } from './ingressService';
import {
  getAdapterForSystem,
  buildLaunchPlan,
  validateAdapterReadiness,
} from './adapterService';
import { isTauriRuntime, launchEmulatorProcess } from './tauriService';
import { classifyEmulatorExit, emulatorExitSummary } from './launchExitService';

export interface LaunchBlocker {
  code:
    | 'missing_drive'
    | 'permission_denied'
    | 'missing_engine'
    | 'missing_core'
    | 'missing_content'
    | 'missing_tauri'
    | 'unsupported_system';
  title: string;
  desc: string;
}

export interface LaunchReadiness {
  ready: boolean;
  blockers: LaunchBlocker[];
  adapterId?: string;
  commandPreview?: string;
}

export interface LaunchResult {
  success: boolean;
  command: string;
  error?: string;
  exitCode?: number | null;
  /** True when the emulator process ended and the shell should return to Arcade Home. */
  returnedCleanly?: boolean;
}

const isDemoMode = (): boolean => localStorage.getItem('xibalba_demo_mode') === 'true';

export const setDemoMode = (enabled: boolean): void => {
  localStorage.setItem('xibalba_demo_mode', enabled ? 'true' : 'false');
};

export const getDemoMode = (): boolean => isDemoMode();

// #ledger:launch_blocked
export const checkLaunchReadiness = async (game: GameRecord): Promise<LaunchReadiness> => {
  const blockers: LaunchBlocker[] = [];
  const adapter = getAdapterForSystem(game.systemId);

  if (!adapter) {
    blockers.push({
      code: 'unsupported_system',
      title: 'Unsupported System',
      desc: `No adapter registered for system "${game.systemId}".`,
    });
    return { ready: false, blockers };
  }

  if (game.ingressMode === 'batch_library' && game.libraryRootId) {
    const roots = getLibraryRoots();
    const root = roots.find((r) => r.id === game.libraryRootId);
    if (!root) {
      blockers.push({
        code: 'missing_drive',
        title: 'Storage Volume Unregistered',
        desc: 'The storage directory containing this game is no longer registered.',
      });
    } else if (!root.mounted) {
      blockers.push({
        code: 'missing_drive',
        title: 'Offline Storage Volume',
        desc: `Volume "${root.label}" is offline.`,
      });
    } else if (root.permissionDenied) {
      blockers.push({
        code: 'permission_denied',
        title: 'Access Permission Denied',
        desc: `Permission denied for volume "${root.label}".`,
      });
    }
  }

  const engine = getEngineSettings();
  const adapterCheck = await validateAdapterReadiness(adapter, engine, game.contentPath);
  for (const missing of adapterCheck.missing) {
    if (missing.toLowerCase().includes('core')) {
      blockers.push({ code: 'missing_core', title: 'Missing Core', desc: missing });
    } else if (missing.toLowerCase().includes('game file')) {
      blockers.push({ code: 'missing_content', title: 'Missing Game File', desc: missing });
    } else {
      blockers.push({ code: 'missing_engine', title: 'Missing Engine', desc: missing });
    }
  }

  if (!isDemoMode() && !isTauriRuntime()) {
    blockers.push({
      code: 'missing_tauri',
      title: 'Desktop Shell Required',
      desc: 'Real launch requires the Tauri desktop app. Run: npm run tauri:dev',
    });
  }

  const plan = buildLaunchPlan(adapter, engine, game.contentPath);

  return {
    ready: blockers.length === 0 && !!plan,
    blockers,
    adapterId: adapter.adapter_id,
    commandPreview: plan?.commandDisplay,
  };
};

/** @deprecated Use launchGame. Kept for demoMode only. */
export const simulateLaunchGame = (game: GameRecord): LaunchResult => {
  const engine = getEngineSettings();
  const adapter = getAdapterForSystem(game.systemId);
  const plan = adapter ? buildLaunchPlan(adapter, engine, game.contentPath) : null;
  const command = plan?.commandDisplay ?? '';

  addLedgerEvent('launch_started', `[DEMO] Simulated launch: ${game.title}`, {
    gameId: game.id,
    command,
    demoMode: true,
  });

  return { success: true, command, returnedCleanly: true };
};

// #ledger:launch_requested
// #xar:controller-launch-proof/current
export const launchGame = async (game: GameRecord): Promise<LaunchResult> => {
  addLedgerEvent('launch_requested', `Launch requested for ${game.title}`, {
    gameId: game.id,
    systemId: game.systemId,
  });

  const readiness = await checkLaunchReadiness(game);
  if (!readiness.ready) {
    const first = readiness.blockers[0];
    addLedgerEvent('launch_blocked', `Launch blocked for ${game.title}: ${first.title}`, {
      gameId: game.id,
      blockerCode: first.code,
    });
    return { success: false, command: readiness.commandPreview ?? '', error: first.desc };
  }

  if (isDemoMode()) {
    return simulateLaunchGame(game);
  }

  const adapter = getAdapterForSystem(game.systemId)!;
  const engine = getEngineSettings();
  const plan = buildLaunchPlan(adapter, engine, game.contentPath);
  if (!plan) {
    addLedgerEvent('launch_failed', `Could not build launch plan for ${game.title}`, {
      gameId: game.id,
    });
    return { success: false, command: '', error: 'Launch plan could not be built.' };
  }

  addLedgerEvent('launch_started', `Starting ${game.title} via ${adapter.display_name}`, {
    gameId: game.id,
    command: plan.commandDisplay,
    adapterId: adapter.adapter_id,
  });

  try {
    const result = await launchEmulatorProcess(plan.program, plan.args);
    const exitKind = classifyEmulatorExit(result.exit_code);

    if (exitKind === 'clean') {
      addLedgerEvent('emulator_exited', `${game.title}: ${emulatorExitSummary(result.exit_code)}`, {
        gameId: game.id,
        exitCode: result.exit_code,
      });
      addLedgerEvent('shell_focus_restored', 'Shell focus restore attempted after emulator exit', {
        gameId: game.id,
      });
      return {
        success: true,
        returnedCleanly: true,
        command: plan.commandDisplay,
        exitCode: result.exit_code,
      };
    }

    addLedgerEvent('launch_failed', `${game.title} exited with error`, {
      gameId: game.id,
      exitCode: result.exit_code,
      stderr: result.stderr,
    });
    return {
      success: false,
      returnedCleanly: false,
      command: plan.commandDisplay,
      error: result.stderr || emulatorExitSummary(result.exit_code),
      exitCode: result.exit_code,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    addLedgerEvent('launch_failed', `Launch failed for ${game.title}: ${message}`, {
      gameId: game.id,
    });
    return { success: false, command: plan.commandDisplay, error: message };
  }
};

export const registerProofGameFromPath = async (
  systemId: 'nes' | 'snes',
  contentPath: string,
  title?: string
): Promise<GameRecord> => {
  const fileName = contentPath.split('/').pop() ?? contentPath;

  const record = await ingressSingleGame(fileName, contentPath, undefined, systemId);
  const settings = getProofGameSettings();
  saveProofGameSettings({
    ...settings,
    nesGameId: systemId === 'nes' ? record.id : settings.nesGameId,
    snesGameId: systemId === 'snes' ? record.id : settings.snesGameId,
    nesContentPath: systemId === 'nes' ? contentPath : settings.nesContentPath,
    snesContentPath: systemId === 'snes' ? contentPath : settings.snesContentPath,
    nesTitle: systemId === 'nes' ? (title ?? record.title) : settings.nesTitle,
    snesTitle: systemId === 'snes' ? (title ?? record.title) : settings.snesTitle,
  });

  addLedgerEvent('rom_detected', `Proof game registered (${systemId}): ${record.title}`, {
    gameId: record.id,
    contentPath,
    proof: true,
  });

  return record;
};
