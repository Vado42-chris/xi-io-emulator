// #xar:controller-launch-proof/display-launch

import type { AdapterLaunchPlan, AdapterManifest } from './adapterService';
import {
  getLaunchDisplayPreferences as getNativeLaunchDisplayPreferences,
  isTauriRuntime,
  saveLaunchDisplayPreferences as saveNativeLaunchDisplayPreferences,
  type ConnectedDisplay,
  type LaunchDisplayPreferences,
} from './tauriService';

export type LaunchDisplayMode = 'fullscreen' | 'windowed';

export interface LaunchDisplaySettings extends LaunchDisplayPreferences {
  mode: LaunchDisplayMode;
}

const STORAGE_KEY = 'xibalba_launch_display_prefs';

export const WINDOW_SIZE_PRESETS = [
  { label: '1280 × 720', width: 1280, height: 720 },
  { label: '1600 × 900', width: 1600, height: 900 },
  { label: '1920 × 1080', width: 1920, height: 1080 },
] as const;

const defaultSettings = (displays: ConnectedDisplay[]): LaunchDisplaySettings => {
  const primary = displays.find((d) => d.primary) ?? displays[0];
  return {
    mode: 'fullscreen',
    displayId: primary?.id ?? 'primary',
    displayIndex: primary?.index ?? 0,
    windowWidth: 1280,
    windowHeight: 720,
    rememberChoice: true,
  };
};

export const loadLaunchDisplaySettings = async (): Promise<LaunchDisplaySettings | null> => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as LaunchDisplaySettings;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  if (isTauriRuntime()) {
    const native = await getNativeLaunchDisplayPreferences();
    if (native) {
      const settings = native as LaunchDisplaySettings;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return settings;
    }
  }

  return null;
};

export const saveLaunchDisplaySettings = async (settings: LaunchDisplaySettings): Promise<void> => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  if (isTauriRuntime()) {
    await saveNativeLaunchDisplayPreferences(settings);
  }
};

export const shouldSkipDisplayPicker = async (
  forcePicker: boolean,
  displays: ConnectedDisplay[] = []
): Promise<boolean> => {
  if (forcePicker) {
    return false;
  }
  if (displays.length <= 1) {
    return true;
  }
  const settings = await loadLaunchDisplaySettings();
  return Boolean(settings?.rememberChoice);
};

export const resolveLaunchDisplaySettings = async (
  forcePicker: boolean,
  displays: ConnectedDisplay[] = []
): Promise<{ settings: LaunchDisplaySettings; skipPicker: boolean }> => {
  const saved = await loadLaunchDisplaySettings();
  const settings = saved ?? defaultSettings(displays);

  if (forcePicker) {
    return { settings, skipPicker: false };
  }
  if (displays.length <= 1) {
    return { settings, skipPicker: true };
  }
  return { settings, skipPicker: Boolean(saved && settings.rememberChoice) };
};

export const applyDisplaySettingsToLaunchPlan = (
  plan: AdapterLaunchPlan,
  adapter: AdapterManifest,
  settings: LaunchDisplaySettings,
  displays: ConnectedDisplay[]
): { plan: AdapterLaunchPlan; env: Record<string, string> } => {
  const display =
    displays.find((d) => d.id === settings.displayId) ??
    displays.find((d) => d.index === settings.displayIndex) ??
    displays[0];

  const env: Record<string, string> = {};
  let args = [...plan.args];

  if (adapter.engine_id === 'fceux') {
    if (settings.mode === 'fullscreen') {
      args.push('--fullscreen', '1');
      env.SDL_VIDEO_FULLSCREEN_DISPLAY = String(settings.displayIndex);
    } else {
      const width = settings.windowWidth;
      const height = settings.windowHeight;
      args.push('--xres', String(width), '--yres', String(height));
      if (display) {
        args.push('--geometry', `${width}x${height}+${display.x}+${display.y}`);
      }
    }
  } else if (adapter.engine_id === 'retroarch') {
    args = args.filter((token) => token !== '-f' && token !== '-w');
    if (settings.mode === 'fullscreen') {
      args.unshift('-f', '--video-fullscreen-screen', String(settings.displayIndex));
    } else {
      args.unshift(
        '-w',
        '--video-windowed-width',
        String(settings.windowWidth),
        '--video-windowed-height',
        String(settings.windowHeight),
        '--screen',
        String(settings.displayIndex)
      );
      if (display) {
        args.push('--video-windowed-x', String(display.x), '--video-windowed-y', String(display.y));
      }
    }
  }

  const commandDisplay = [plan.program, ...args]
    .map((p) => (p.includes(' ') ? `"${p}"` : p))
    .join(' ');

  return {
    plan: { ...plan, args, commandDisplay },
    env,
  };
};

export const formatDisplaySettingsSummary = (
  settings: LaunchDisplaySettings,
  displays: ConnectedDisplay[]
): string => {
  const display =
    displays.find((d) => d.id === settings.displayId) ??
    displays.find((d) => d.index === settings.displayIndex);
  const screen = display?.name ?? `Display ${settings.displayIndex + 1}`;
  if (settings.mode === 'fullscreen') {
    return `Fullscreen on ${screen}`;
  }
  return `Windowed ${settings.windowWidth}×${settings.windowHeight} on ${screen}`;
};
