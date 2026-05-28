// #adapter:fceux/nes
// #adapter:retroarch/snes
// #xar:controller-launch-proof/current

import fceuxManifest from '../data/adapters/fceux.nes.json';
import retroarchSnesManifest from '../data/adapters/retroarch.snes.snes9x.json';
import type { EngineSettings } from './db';
import { checkPathExists, isTauriRuntime } from './tauriService';

export interface AdapterManifest {
  adapter_id: string;
  adapter_version: string;
  engine_id: string;
  system_id: string;
  display_name: string;
  description: string;
  content_extensions: string[];
  requires_bios: boolean;
  required_files: Array<{
    kind: string;
    setting_id: string;
    label: string;
  }>;
  launch_template: string[];
  controller_profile: string;
}

export interface AdapterLaunchPlan {
  adapterId: string;
  program: string;
  args: string[];
  commandDisplay: string;
}

const ADAPTERS: Record<string, AdapterManifest> = {
  'fceux.nes': fceuxManifest as AdapterManifest,
  'retroarch.snes.snes9x': retroarchSnesManifest as AdapterManifest,
};

export const getAdapterForSystem = (systemId: string): AdapterManifest | undefined => {
  if (systemId === 'nes') return ADAPTERS['fceux.nes'];
  if (systemId === 'snes') return ADAPTERS['retroarch.snes.snes9x'];
  return Object.values(ADAPTERS).find((a) => a.system_id === systemId);
};

export const getAdapterById = (adapterId: string): AdapterManifest | undefined =>
  ADAPTERS[adapterId];

export const resolveEnginePath = (
  settings: EngineSettings,
  settingId: string
): string | undefined => {
  switch (settingId) {
    case 'engine.fceux.binary_path':
      return settings.fceuxBinaryPath && settings.fceuxBinaryPath !== 'Not set'
        ? settings.fceuxBinaryPath
        : undefined;
    case 'engine.retroarch.binary_path':
      return settings.retroarchBinaryPath && settings.retroarchBinaryPath !== 'Not set'
        ? settings.retroarchBinaryPath
        : undefined;
    case 'engine.retroarch.snes_core_path':
      return settings.snesCorePath && settings.snesCorePath !== 'Not set'
        ? settings.snesCorePath
        : undefined;
    default:
      return undefined;
  }
};

export const buildLaunchPlan = (
  adapter: AdapterManifest,
  settings: EngineSettings,
  contentPath: string
): AdapterLaunchPlan | null => {
  const enginePath = resolveEnginePath(
    settings,
    adapter.required_files.find((f) => f.kind === 'engine_binary')?.setting_id ?? ''
  );
  if (!enginePath) return null;

  const corePath = resolveEnginePath(
    settings,
    adapter.required_files.find((f) => f.kind === 'libretro_core')?.setting_id ?? ''
  );

  const args = adapter.launch_template
    .filter((token) => token !== '{engine_path}')
    .map((token) => {
      if (token === '{content_path}') return contentPath;
      if (token === '{core_path}') return corePath ?? '';
      return token;
    })
    .filter(Boolean);

  if (args.some((a) => a === '')) return null;

  const commandDisplay = [enginePath, ...args].map((p) => (p.includes(' ') ? `"${p}"` : p)).join(' ');

  return {
    adapterId: adapter.adapter_id,
    program: enginePath,
    args,
    commandDisplay,
  };
};

export const validateAdapterReadiness = async (
  adapter: AdapterManifest,
  settings: EngineSettings,
  contentPath?: string
): Promise<{ ready: boolean; missing: string[] }> => {
  const missing: string[] = [];

  for (const req of adapter.required_files) {
    const path = resolveEnginePath(settings, req.setting_id);
    if (!path) {
      missing.push(req.label);
      continue;
    }
    if (isTauriRuntime()) {
      const check = await checkPathExists(path);
      if (!check.exists) missing.push(`${req.label} (not found: ${path})`);
    }
  }

  if (contentPath) {
    if (isTauriRuntime()) {
      const contentCheck = await checkPathExists(contentPath);
      if (!contentCheck.exists) missing.push(`Game file (not found: ${contentPath})`);
    }
    const ext = contentPath.slice(contentPath.lastIndexOf('.')).toLowerCase();
    if (!adapter.content_extensions.includes(ext)) {
      missing.push(`Unsupported extension ${ext} for ${adapter.display_name}`);
    }
  }

  return { ready: missing.length === 0, missing };
};
