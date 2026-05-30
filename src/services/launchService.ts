/**
 * Pass B launch orchestration — readiness blockers, preflight, invoke, ledger events.
 *
 * Failure codes: XIO-LCH-001–005, 010 (blockers), 016 (validateLaunchPlan preflight),
 * 014/015/006 (post-invoke via Tauri/Rust). Runbook: docs/operations/troubleshooting-pass-b.md
 */
import type { GameRecord } from '../data/gameModels';
import { getLibraryRoots, getEngineSettings, addLedgerEvent, getProofGameSettings, saveProofGameSettings } from './db';
import { ingressSingleGame } from './ingressService';
import {
  getAdapterForSystem,
  buildLaunchPlan,
  validateAdapterReadiness,
} from './adapterService';
import { isTauriRuntime, launchEmulatorProcess, validateLaunchPlan } from './tauriService';
import { classifyEmulatorExit, emulatorExitSummary } from './launchExitService';
import { isStaleDemoContentPath, staleDemoLaunchBlocker } from './proofGameService';
import {
  applyDisplaySettingsToLaunchPlan,
  type LaunchDisplaySettings,
} from './launchDisplayService';
import { finalizeEngineLaunch, formatLaunchCommand } from './engineLaunchService';
import { listConnectedDisplays } from './tauriService';
import { recordGameLaunch } from './playSessionService';
import { applyControllerMappingForLaunch } from './controllerMappingService';

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
  /** True when launch returned immediately and the game is still running in the background. */
  sessionActive?: boolean;
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

  if (isStaleDemoContentPath(game.contentPath)) {
    // #xar:controller-launch-proof/pass-b — mock /media/arcade-usb/ batch ingress, not missing user ROM
    const stale = staleDemoLaunchBlocker(game);
    blockers.push({ code: 'missing_content', title: stale.title, desc: stale.desc });
    return {
      ready: false,
      blockers,
      adapterId: adapter.adapter_id,
    };
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
    const lower = missing.toLowerCase();
    if (lower.includes('core')) {
      blockers.push({
        code: 'missing_core',
        title: `${adapter.display_name}: core missing`,
        desc: missing,
      });
    } else if (lower.includes('game file')) {
      blockers.push({
        code: 'missing_content',
        title: `${game.systemId.toUpperCase()} content missing`,
        desc: missing,
      });
    } else {
      blockers.push({
        code: 'missing_engine',
        title: `${adapter.display_name} not configured`,
        desc: missing,
      });
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
  const previewPlan = plan
    ? finalizeEngineLaunch(plan.program, plan.args)
    : null;

  if (previewPlan && isTauriRuntime()) {
    const validation = await validateLaunchPlan(previewPlan.program, previewPlan.args);
    if (!validation.valid && validation.error) {
      blockers.push({
        code: 'missing_engine',
        title: `${adapter.display_name} launch not ready`,
        desc: validation.error,
      });
    }
  }

  return {
    ready: blockers.length === 0 && !!plan,
    blockers,
    adapterId: adapter.adapter_id,
    commandPreview: previewPlan
      ? formatLaunchCommand(previewPlan.program, previewPlan.args)
      : undefined,
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

  recordGameLaunch(game.id);

  return { success: true, command, returnedCleanly: true };
};

// #ledger:launch_requested
// #xar:controller-launch-proof/current
export const launchGame = async (
  game: GameRecord,
  displaySettings?: LaunchDisplaySettings
): Promise<LaunchResult> => {
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
  const basePlan = buildLaunchPlan(adapter, engine, game.contentPath);
  if (!basePlan) {
    addLedgerEvent('launch_failed', `Could not build launch plan for ${game.title}`, {
      gameId: game.id,
    });
    return { success: false, command: '', error: 'Launch plan could not be built.' };
  }

  const displays = isTauriRuntime() ? await listConnectedDisplays() : [];
  const withDisplay = displaySettings
    ? applyDisplaySettingsToLaunchPlan(basePlan, adapter, displaySettings, displays)
    : { plan: basePlan, env: {} as Record<string, string> };

  const mapping = await applyControllerMappingForLaunch(adapter);
  if (mapping.warning && adapter.engine_id === 'fceux') {
    addLedgerEvent('launch_blocked', `Launch blocked: ${mapping.warning}`, {
      gameId: game.id,
      profileId: adapter.controller_profile,
    });
    return { success: false, command: withDisplay.plan.commandDisplay, error: mapping.warning };
  }

  const planWithMapping = {
    ...withDisplay.plan,
    args: [...mapping.extraArgs, ...withDisplay.plan.args],
  };

  const finalized = finalizeEngineLaunch(planWithMapping.program, planWithMapping.args);
  const plan = {
    ...planWithMapping,
    program: finalized.program,
    args: finalized.args,
    commandDisplay: formatLaunchCommand(finalized.program, finalized.args),
  };
  const env = { ...withDisplay.env, ...mapping.env };

  addLedgerEvent('launch_started', `Starting ${game.title} via ${adapter.display_name}`, {
    gameId: game.id,
    command: plan.commandDisplay,
    adapterId: adapter.adapter_id,
    displayMode: displaySettings?.mode,
    displayId: displaySettings?.displayId,
    controllerProfileApplied: mapping.applied ? mapping.profileId : undefined,
  });

  recordGameLaunch(game.id);

  try {
    const result = await launchEmulatorProcess({
      program: plan.program,
      args: plan.args,
      env,
      gameId: game.id,
      engineId: adapter.engine_id,
      contentPath: game.contentPath,
    });

    if (result.session_started) {
      addLedgerEvent('launch_started', `${game.title} session active (shell hibernated)`, {
        gameId: game.id,
      });
      return {
        success: true,
        sessionActive: true,
        command: plan.commandDisplay,
      };
    }

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
