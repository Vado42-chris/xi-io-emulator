// #xio:emulator/controller/shell-exit
// #xar:controller-launch-proof/pass-b

import {
  captureShellExitButton as captureNative,
  clearShellExitMapping as clearNative,
  getShellExitMapping as getNative,
  isTauriRuntime,
  saveShellExitMapping as saveNative,
  type ShellExitMapping,
} from './tauriService';

export type { ShellExitMapping };

const SESSION_SKIP_KEY = 'xibalba_shell_exit_setup_skipped_session';

export const getShellExitMapping = async (): Promise<ShellExitMapping | null> => {
  if (!isTauriRuntime()) {
    return null;
  }
  return getNative();
};

export const saveShellExitMapping = async (mapping: ShellExitMapping): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }
  await saveNative(mapping);
};

export const clearShellExitMapping = async (): Promise<void> => {
  if (!isTauriRuntime()) {
    return;
  }
  await clearNative();
};

export const captureShellExitButton = async (timeoutMs = 20000): Promise<ShellExitMapping> => {
  if (!isTauriRuntime()) {
    throw new Error('Return-to-Arcade button setup requires the Tauri desktop shell.');
  }
  return captureNative(timeoutMs);
};

export const skipShellExitSetupThisSession = (): void => {
  sessionStorage.setItem(SESSION_SKIP_KEY, 'true');
};

export const isShellExitSetupSkippedThisSession = (): boolean =>
  sessionStorage.getItem(SESSION_SKIP_KEY) === 'true';

export const shouldShowShellExitSetup = async (): Promise<boolean> => {
  if (!isTauriRuntime() || isShellExitSetupSkippedThisSession()) {
    return false;
  }
  const mapping = await getShellExitMapping();
  return mapping == null;
};

export const formatShellExitHint = (mapping: ShellExitMapping | null): string => {
  if (mapping) {
    return `Press ${mapping.buttonLabel}, hold Select + Start, or press Guide/Home to return to Arcade. Esc works on keyboard.`;
  }
  return 'Hold Select + Start for 1 second, or press Guide/Home, to return to Arcade. No FCEUX menus needed. Esc works on keyboard.';
};

export const formatShellExitShortLabel = (mapping: ShellExitMapping | null): string =>
  mapping?.buttonLabel ?? 'Select+Start / Guide';
