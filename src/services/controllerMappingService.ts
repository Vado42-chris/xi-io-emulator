/**
 * XARCADE-CONTROLLER-MAPPING-001 — apply virtual profiles at launch.
 * Pass B: FCEUX isolated HOME + input/default.txt (slice 1–2).
 */
import type { AdapterManifest } from './adapterService';
import nesStandardProfile from '../data/controllerProfiles/nes.standard.v1.json';
import { addLedgerEvent } from './db';
import { getControllerSnapshot, syncLiveControllerSnapshot } from './controllerService';
import { isTauriRuntime, prepareFceuxControllerLaunch } from './tauriService';

const GENERIC_GAMEPAD_GUID = '03000000000000000000000000000000';

interface FceuxButtonMap {
  a: string;
  b: string;
  back: string;
  start: string;
  dpup: string;
  dpdown: string;
  dpleft: string;
  dpright: string;
  turboA: string;
  turboB: string;
}

interface NesStandardProfile {
  id: string;
  fceux: {
    player_index: number;
    buttons: FceuxButtonMap;
  };
}

const PROFILE_BY_ID: Record<string, NesStandardProfile> = {
  'nes.standard.v1': nesStandardProfile as NesStandardProfile,
};

export interface ControllerLaunchMappingResult {
  env: Record<string, string>;
  extraArgs: string[];
  applied: boolean;
  profileId?: string;
  deviceGuid?: string;
  warning?: string;
}

/** Parse 16-byte SDL GUID from Gamepad API id string. */
export const extractGamepadGuidFromBrowser = (): string | null => {
  const pads = navigator.getGamepads?.() ?? [];
  for (const pad of pads) {
    if (!pad?.id) continue;
    const match = pad.id.match(/([0-9a-f]{32})/i);
    if (match) {
      return match[1].toLowerCase();
    }
    const shortMatch = pad.id.match(/([0-9a-f]{16})/i);
    if (shortMatch) {
      return shortMatch[1].toLowerCase().padEnd(32, '0');
    }
  }
  return null;
};

export const buildFceuxInputFileContent = (
  deviceGuid: string,
  profile: NesStandardProfile
): string => {
  const b = profile.fceux.buttons;
  const player = profile.fceux.player_index;
  const mapped = `${deviceGuid},default,config:${player},a:${b.a},b:${b.b},back:${b.back},start:${b.start},dpup:${b.dpup},dpdown:${b.dpdown},dpleft:${b.dpleft},dpright:${b.dpright},turboA:${b.turboA},turboB:${b.turboB},`;
  const unmapped = `${deviceGuid},default,config:PLACEHOLDER,a:k,b:k,back:k,start:k,dpup:k,dpdown:k,dpleft:k,dpright:k,turboA:k,turboB:k,`;
  const lines = [0, 1, 2, 3].map((idx) =>
    idx === player ? mapped : unmapped.replace('PLACEHOLDER', String(idx))
  );
  return `${lines.join('\n')}\n`;
};

export const applyControllerMappingForLaunch = async (
  adapter: AdapterManifest
): Promise<ControllerLaunchMappingResult> => {
  if (adapter.engine_id !== 'fceux') {
    return { env: {}, extraArgs: [], applied: false };
  }

  if (!isTauriRuntime()) {
    return {
      env: {},
      extraArgs: [],
      applied: false,
      warning: 'Controller mapping requires Tauri desktop shell.',
    };
  }

  const profile = PROFILE_BY_ID[adapter.controller_profile];
  if (!profile) {
    addLedgerEvent('controller_mapping_failed', `Unknown controller profile: ${adapter.controller_profile}`, {
      profileId: adapter.controller_profile,
    });
    return {
      env: {},
      extraArgs: [],
      applied: false,
      warning: `Unknown controller profile ${adapter.controller_profile}`,
    };
  }

  await syncLiveControllerSnapshot();
  const snapshot = getControllerSnapshot();
  const hasSource = snapshot.devices.length > 0 || snapshot.browserGamepadCount > 0;
  if (!hasSource) {
    addLedgerEvent('controller_mapping_failed', 'No controller detected before NES launch', {});
    return {
      env: {},
      extraArgs: [],
      applied: false,
      warning: 'No controller detected. Connect a USB gamepad and retry.',
    };
  }

  const deviceGuid = extractGamepadGuidFromBrowser() ?? GENERIC_GAMEPAD_GUID;
  const inputContent = buildFceuxInputFileContent(deviceGuid, profile);

  try {
    const prep = await prepareFceuxControllerLaunch({
      deviceGuid,
      inputFileContent: inputContent,
    });
    addLedgerEvent('controller_profile_applied_to_launch', 'FCEUX input mapping written for launch', {
      profileId: profile.id,
      deviceGuid: prep.deviceGuid,
      homeDir: prep.homeDir,
    });
    return {
      env: { HOME: prep.homeDir },
      extraArgs: ['--input1', 'gamepad'],
      applied: true,
      profileId: profile.id,
      deviceGuid: prep.deviceGuid,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    addLedgerEvent('controller_mapping_failed', `FCEUX mapping prep failed: ${message}`, {
      profileId: profile.id,
      deviceGuid,
    });
    return {
      env: {},
      extraArgs: [],
      applied: false,
      warning: message,
    };
  }
};
