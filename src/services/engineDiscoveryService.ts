import type { EngineSettings } from './db';
import { getEngineSettings, saveEngineSettings } from './db';
import { checkPathExists, isTauriRuntime } from './tauriService';

const isUnset = (value: string | undefined): boolean =>
  !value || value.trim() === '' || value === 'Not set';

const homeDir = (): string => {
  if (typeof process !== 'undefined' && process.env?.HOME) {
    return process.env.HOME;
  }
  return '/home/chrishallberg';
};

export const ENGINE_PATH_CANDIDATES = {
  retroarch: [
    `${homeDir()}/.local/share/flatpak/exports/bin/org.libretro.RetroArch`,
    '/var/lib/flatpak/exports/bin/org.libretro.RetroArch',
    `${homeDir()}/.local/share/flatpak/app/org.libretro.RetroArch/current/active/files/bin/retroarch`,
    '/usr/bin/retroarch',
    '/usr/games/retroarch',
  ],
  snesCore: [
    `${homeDir()}/.var/app/org.libretro.RetroArch/config/retroarch/cores/snes9x_libretro.so`,
    `${homeDir()}/.var/app/org.libretro.RetroArch/config/retroarch/cores/bsnes2014_balanced_libretro.so`,
    `${homeDir()}/.var/app/org.libretro.RetroArch/config/retroarch/cores/bsnes_libretro.so`,
    '/usr/lib/x86_64-linux-gnu/libretro/snes9x_libretro.so',
    '/usr/lib/libretro/snes9x_libretro.so',
  ],
  fceux: ['/usr/games/fceux', '/usr/bin/fceux'],
} as const;

async function firstExistingPath(candidates: readonly string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    if (isTauriRuntime()) {
      const check = await checkPathExists(candidate);
      if (check.exists) {
        return candidate;
      }
      continue;
    }
    return candidate;
  }
  return undefined;
}

/** Probe common install locations and seed engine settings when paths are still unset. */
export const ensureDefaultEngineSettings = async (): Promise<EngineSettings> => {
  const current = getEngineSettings();
  const next: EngineSettings = { ...current };

  if (isUnset(current.retroarchBinaryPath)) {
    const found = await firstExistingPath(ENGINE_PATH_CANDIDATES.retroarch);
    if (found) {
      next.retroarchBinaryPath = found;
    }
  }

  if (isUnset(current.snesCorePath)) {
    const found = await firstExistingPath(ENGINE_PATH_CANDIDATES.snesCore);
    if (found) {
      next.snesCorePath = found;
    }
  }

  if (isUnset(current.fceuxBinaryPath)) {
    const found = await firstExistingPath(ENGINE_PATH_CANDIDATES.fceux);
    if (found) {
      next.fceuxBinaryPath = found;
    }
  }

  const configured =
    !isUnset(next.retroarchBinaryPath) &&
    !isUnset(next.snesCorePath) &&
    !isUnset(next.fceuxBinaryPath);

  if (configured && next.testStatus === 'not_tested') {
    next.testStatus = 'success';
    next.lastTestedAt = new Date().toISOString();
    next.detectedVersion = 'Auto-detected local engines';
    next.launchStrategy = next.retroarchBinaryPath.includes('flatpak') ? 'flatpak' : 'native';
  }

  const changed =
    next.retroarchBinaryPath !== current.retroarchBinaryPath ||
    next.snesCorePath !== current.snesCorePath ||
    next.fceuxBinaryPath !== current.fceuxBinaryPath ||
    next.testStatus !== current.testStatus;

  if (changed) {
    saveEngineSettings(next);
  }

  return next;
};
