// #xar:controller-launch-proof/tauri/active

export interface PathCheckResult {
  path: string;
  exists: boolean;
  is_file: boolean;
}

export interface SpawnResult {
  success: boolean;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  /** Emulator still running; shell hibernated — wait for emulator-session-finished event. */
  session_started?: boolean;
}

export interface InputDeviceInfo {
  name: string;
  handlers: string[];
  is_joystick: boolean;
}

export interface ShellExitMapping {
  devicePath: string;
  deviceName: string;
  inputKind: 'evdev' | 'js';
  buttonCode: number;
  buttonLabel: string;
  configuredAt: string;
  /** Legacy js-only mappings */
  buttonNumber?: number;
}

export interface ConnectedDisplay {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  primary: boolean;
  index: number;
}

export interface LaunchDisplayPreferences {
  mode: 'fullscreen' | 'windowed';
  displayId: string;
  displayIndex: number;
  windowWidth: number;
  windowHeight: number;
  rememberChoice: boolean;
}

export interface EmulatorSessionRecord {
  gameId: string;
  contentPath: string;
  engineId: string;
  program: string;
  startedAt: string;
  endedAt?: string;
  exitReason: string;
  pids: number[];
}

export const isTauriRuntime = (): boolean => {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
};

const getInvoke = async () => {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke;
};

export const checkPathExists = async (path: string): Promise<PathCheckResult> => {
  if (!isTauriRuntime()) {
    return { path, exists: false, is_file: false };
  }
  const invoke = await getInvoke();
  return invoke<PathCheckResult>('path_exists', { path });
};

export const commandOnPath = async (name: string): Promise<boolean> => {
  if (!isTauriRuntime()) {
    return false;
  }
  const invoke = await getInvoke();
  return invoke<boolean>('command_on_path', { name });
};

export interface LaunchPlanValidation {
  valid: boolean;
  error?: string | null;
  program: string;
  args: string[];
}

export const validateLaunchPlan = async (
  program: string,
  args: string[],
): Promise<LaunchPlanValidation> => {
  if (!isTauriRuntime()) {
    return { valid: true, program, args };
  }
  const invoke = await getInvoke();
  return invoke<LaunchPlanValidation>('validate_launch_plan', { program, args });
};

export interface FceuxLaunchInputPrep {
  homeDir: string;
  deviceGuid: string;
}

export const prepareFceuxControllerLaunch = async (options: {
  deviceGuid: string;
  inputFileContent: string;
}): Promise<FceuxLaunchInputPrep> => {
  if (!isTauriRuntime()) {
    throw new Error('FCEUX controller mapping requires Tauri desktop shell.');
  }
  const invoke = await getInvoke();
  return invoke<FceuxLaunchInputPrep>('prepare_fceux_controller_launch_cmd', {
    deviceGuid: options.deviceGuid,
    inputFileContent: options.inputFileContent,
  });
};

export const resolvePrimaryGamepadSdlGuid = async (): Promise<string | null> => {
  if (!isTauriRuntime()) {
    return null;
  }
  const invoke = await getInvoke();
  return invoke<string | null>('resolve_primary_gamepad_sdl_guid_cmd');
};

export interface EmulatorSessionStartedPayload {
  gameId: string;
  sessionId: string;
  shellWindowTitle: string;
  gameWindowTitle: string;
}

export const onEmulatorSessionStarted = async (
  handler: (payload: EmulatorSessionStartedPayload) => void
): Promise<() => void> => {
  if (!isTauriRuntime()) {
    return () => {};
  }
  const { listen } = await import('@tauri-apps/api/event');
  return listen<EmulatorSessionStartedPayload>('emulator-session-started', (event) => {
    handler(event.payload);
  });
};

export interface EmulatorSessionFinishedPayload {
  gameId: string;
  sessionId: string;
  reason: string;
  returnedCleanly: boolean;
  errorMessage?: string | null;
  sessionReachedGame?: boolean;
}

export interface ShellFocusRestorePayload {
  gameId: string;
  sessionId: string;
  reasonCode?: string | null;
  stage?: string | null;
  timestamp: string;
}

export const SHELL_FOCUS_RESTORE_FAILED_MESSAGE =
  'The game closed, but xi-io could not confirm that the shell regained focus. Press Alt+Tab or click the xi-io window, then check the session log.';

export const onShellFocusRestored = async (
  handler: (payload: ShellFocusRestorePayload) => void
): Promise<() => void> => {
  if (!isTauriRuntime()) {
    return () => {};
  }
  const { listen } = await import('@tauri-apps/api/event');
  return listen<ShellFocusRestorePayload>('shell-focus-restored', (event) => {
    handler(event.payload);
  });
};

export const onShellFocusRestoreFailed = async (
  handler: (payload: ShellFocusRestorePayload) => void
): Promise<() => void> => {
  if (!isTauriRuntime()) {
    return () => {};
  }
  const { listen } = await import('@tauri-apps/api/event');
  return listen<ShellFocusRestorePayload>('shell-focus-restore-failed', (event) => {
    handler(event.payload);
  });
};

export const onEmulatorSessionFinished = async (
  handler: (payload: EmulatorSessionFinishedPayload) => void
): Promise<() => void> => {
  if (!isTauriRuntime()) {
    return () => {};
  }
  const { listen } = await import('@tauri-apps/api/event');
  return listen<EmulatorSessionFinishedPayload>('emulator-session-finished', (event) => {
    handler(event.payload);
  });
};

/** Manual recovery only — normal session exit restores the shell in Rust before this event fires. */
export const restoreArcadeWindow = async (gameId?: string): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }
  const invoke = await getInvoke();
  await invoke('restore_arcade_window', { gameId: gameId ?? null });
};

export interface LaunchEmulatorOptions {
  program: string;
  args: string[];
  env?: Record<string, string>;
  gameId: string;
  engineId: string;
  contentPath: string;
}

export const launchEmulatorProcess = async (
  options: LaunchEmulatorOptions
): Promise<SpawnResult> => {
  if (!isTauriRuntime()) {
    throw new Error(
      'Real launch requires the Tauri desktop shell. Run: npm run tauri:dev'
    );
  }
  const invoke = await getInvoke();
  return invoke<SpawnResult>('launch_emulator', {
    program: options.program,
    args: options.args,
    env: options.env ?? {},
    gameId: options.gameId,
    engineId: options.engineId,
    contentPath: options.contentPath,
  });
};

export const identifyConnectedDisplays = async (
  highlightIndex?: number
): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }
  const invoke = await getInvoke();
  await invoke('identify_connected_displays', {
    highlightIndex: highlightIndex ?? null,
  });
};

export const listConnectedDisplays = async (): Promise<ConnectedDisplay[]> => {
  if (!isTauriRuntime()) {
    return [
      {
        id: 'primary',
        name: 'Primary Display',
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        primary: true,
        index: 0,
      },
    ];
  }
  const invoke = await getInvoke();
  return invoke<ConnectedDisplay[]>('list_connected_displays_cmd');
};

export const getLaunchDisplayPreferences = async (): Promise<LaunchDisplayPreferences | null> => {
  if (!isTauriRuntime()) {
    return null;
  }
  const invoke = await getInvoke();
  return invoke<LaunchDisplayPreferences | null>('get_launch_display_preferences');
};

export const saveLaunchDisplayPreferences = async (
  prefs: LaunchDisplayPreferences
): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }
  const invoke = await getInvoke();
  await invoke('save_launch_display_preferences', { prefs });
};

export const getLastEmulatorSession = async (): Promise<EmulatorSessionRecord | null> => {
  if (!isTauriRuntime()) {
    return null;
  }
  const invoke = await getInvoke();
  return invoke<EmulatorSessionRecord | null>('get_last_emulator_session');
};

/** Request clean return from an in-flight emulator (Esc fallback from the shell UI). */
export const terminateActiveEmulator = async (): Promise<boolean> => {
  if (!isTauriRuntime()) {
    return false;
  }
  const invoke = await getInvoke();
  return invoke<boolean>('terminate_active_emulator');
};

export const listLinuxInputDevices = async (): Promise<InputDeviceInfo[]> => {
  if (!isTauriRuntime()) {
    return [];
  }
  try {
    const invoke = await getInvoke();
    return invoke<InputDeviceInfo[]>('list_input_devices');
  } catch {
    return [];
  }
};

export const getShellExitMapping = async (): Promise<ShellExitMapping | null> => {
  if (!isTauriRuntime()) {
    return null;
  }
  const invoke = await getInvoke();
  return invoke<ShellExitMapping | null>('get_shell_exit_mapping');
};

export const saveShellExitMapping = async (mapping: ShellExitMapping): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }
  const invoke = await getInvoke();
  await invoke('save_shell_exit_mapping_cmd', { mapping });
};

export const clearShellExitMapping = async (): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }
  const invoke = await getInvoke();
  await invoke('clear_shell_exit_mapping_cmd');
};

export const captureShellExitButton = async (timeoutMs = 20000): Promise<ShellExitMapping> => {
  if (!isTauriRuntime()) {
    throw new Error('Return-to-Arcade button setup requires the Tauri desktop shell.');
  }
  const invoke = await getInvoke();
  return invoke<ShellExitMapping>('capture_shell_exit_button_cmd', { timeoutMs });
};

export const listShellExitCaptureSources = async (): Promise<string> => {
  if (!isTauriRuntime()) {
    return 'Tauri required for native input capture.';
  }
  const invoke = await getInvoke();
  return invoke<string>('list_shell_exit_capture_sources');
};
