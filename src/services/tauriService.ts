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
}

export interface InputDeviceInfo {
  name: string;
  handlers: string[];
  is_joystick: boolean;
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

export const launchEmulatorProcess = async (
  program: string,
  args: string[]
): Promise<SpawnResult> => {
  if (!isTauriRuntime()) {
    throw new Error(
      'Real launch requires the Tauri desktop shell. Run: npm run tauri:dev'
    );
  }
  const invoke = await getInvoke();
  return invoke<SpawnResult>('launch_emulator', { program, args });
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
