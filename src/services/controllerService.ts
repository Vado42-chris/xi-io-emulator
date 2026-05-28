// #xio:emulator/controller/proof
// #xar:controller-launch-proof/current

import { addLedgerEvent } from './db';
import { isTauriRuntime, listLinuxInputDevices, type InputDeviceInfo } from './tauriService';

export type ControllerProofState =
  | 'not_detected'
  | 'detected'
  | 'test_passed'
  | 'test_failed'
  | 'in_game_verified';

export interface ControllerSnapshot {
  state: ControllerProofState;
  devices: InputDeviceInfo[];
  browserGamepadCount: number;
  browserGamepadLabels: string[];
  lastTestAt?: string;
  notes: string[];
}

const STORAGE_KEY = 'xibalba_controller_proof';

export const getControllerSnapshot = (): ControllerSnapshot => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      state: 'not_detected',
      devices: [],
      browserGamepadCount: 0,
      browserGamepadLabels: [],
      notes: [],
    };
  }
  try {
    return JSON.parse(raw) as ControllerSnapshot;
  } catch {
    return {
      state: 'not_detected',
      devices: [],
      browserGamepadCount: 0,
      browserGamepadLabels: [],
      notes: [],
    };
  }
};

export const saveControllerSnapshot = (snapshot: ControllerSnapshot): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};

export const pollControllerDevices = async (): Promise<ControllerSnapshot> => {
  const browserPads = navigator.getGamepads?.() ?? [];
  const connectedPads = Array.from(browserPads).filter(Boolean);
  const browserLabels = connectedPads.map((p) => p?.id ?? 'Unknown gamepad');

  let linuxDevices: InputDeviceInfo[] = [];
  if (isTauriRuntime()) {
    linuxDevices = await listLinuxInputDevices();
  }

  const notes: string[] = [];
  if (!isTauriRuntime()) {
    notes.push(
      'Browser dev mode: Linux /dev/input scan requires Tauri. Use in-game FCEUX proof or run npm run tauri:dev.'
    );
  }

  const detected =
    linuxDevices.length > 0 || connectedPads.length > 0;

  const snapshot: ControllerSnapshot = {
    state: detected ? 'detected' : 'not_detected',
    devices: linuxDevices,
    browserGamepadCount: connectedPads.length,
    browserGamepadLabels: browserLabels,
    notes,
  };

  saveControllerSnapshot(snapshot);

  if (detected) {
    addLedgerEvent('controller_detected', 'Physical controller source detected', {
      linuxDevices: linuxDevices.length,
      browserGamepads: connectedPads.length,
    });
  } else {
    addLedgerEvent('controller_mapping_failed', 'No controller detected during poll', {});
  }

  return snapshot;
};

export const runVisualControllerTest = async (): Promise<ControllerSnapshot> => {
  addLedgerEvent('controller_test_started', 'Visual controller test started', {});

  const snapshot = await pollControllerDevices();
  const passed = snapshot.devices.length > 0 || snapshot.browserGamepadCount > 0;

  const result: ControllerSnapshot = {
    ...snapshot,
    state: passed ? 'test_passed' : 'test_failed',
    lastTestAt: new Date().toISOString(),
    notes: [
      ...snapshot.notes,
      passed
        ? 'Shell detected at least one controller source. Confirm in-game input via FCEUX/RetroArch launch proof.'
        : 'No controller detected. Connect a USB/Bluetooth pad and press a button, then retry.',
    ],
  };

  saveControllerSnapshot(result);
  addLedgerEvent(
    passed ? 'controller_mapping_created' : 'controller_mapping_failed',
    passed ? 'Controller visual test passed' : 'Controller visual test failed',
    { browserGamepads: result.browserGamepadCount, linuxDevices: result.devices.length }
  );

  return result;
};

export const markInGameControllerVerified = (): ControllerSnapshot => {
  const current = getControllerSnapshot();
  const updated: ControllerSnapshot = {
    ...current,
    state: 'in_game_verified',
    lastTestAt: new Date().toISOString(),
    notes: [
      ...current.notes,
      'In-game controller input verified by user after emulator launch.',
    ],
  };
  saveControllerSnapshot(updated);
  addLedgerEvent('controller_detected', 'In-game controller verification recorded', {});
  return updated;
};

export const controllerStateForStatusPanel = (
  snapshot: ControllerSnapshot
): 'not configured' | 'connected' | 'unmapped' | 'error' => {
  switch (snapshot.state) {
    case 'in_game_verified':
    case 'test_passed':
      return 'connected';
    case 'detected':
      return 'unmapped';
    case 'test_failed':
      return 'error';
    default:
      return 'not configured';
  }
};
