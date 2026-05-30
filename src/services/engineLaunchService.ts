/**
 * TypeScript mirror of Rust `engine_launch.rs` — Flatpak normalize after display flags.
 * Keep FLATPAK_RETROARCH_APP in sync with Rust. Failure code: XIO-LCH-015.
 */
/** Flatpak RetroArch app id — must match Rust `engine_launch.rs`. */
export const FLATPAK_RETROARCH_APP = 'org.libretro.RetroArch';

const FLATPAK_RUN_PREFIX = ['run', FLATPAK_RETROARCH_APP] as const;

/** Export wrapper scripts — invoke Flatpak correctly without `flatpak run` rewriting. */
export const isFlatpakExportLauncher = (program: string): boolean => {
  const lower = program.toLowerCase();
  return (
    lower.includes('/exports/bin/org.libretro.retroarch') ||
    lower.endsWith('/org.libretro.retroarch')
  );
};

/** Internal sandbox binary — must be launched via `flatpak run`. */
export const needsFlatpakRunWrapper = (program: string): boolean => {
  if (program === 'flatpak') {
    return false;
  }
  if (isFlatpakExportLauncher(program)) {
    return false;
  }
  const lower = program.toLowerCase();
  return lower.includes('flatpak') || lower.includes('org.libretro.retroarch');
};

export const isFlatpakLaunch = (program: string): boolean =>
  program === 'flatpak' || isFlatpakExportLauncher(program);

export const splitFlatpakArgs = (
  args: string[],
): { prefix: string[]; emulatorArgs: string[] } => {
  if (args[0] === 'run' && args[1] === FLATPAK_RETROARCH_APP) {
    return { prefix: [...FLATPAK_RUN_PREFIX], emulatorArgs: args.slice(2) };
  }
  return { prefix: [], emulatorArgs: args };
};

/** Apply flatpak run wrapper last — after display flags are on RetroArch args. */
export const finalizeEngineLaunch = (
  program: string,
  args: string[],
): { program: string; args: string[] } => {
  if (program === 'flatpak') {
    return repairFlatpakLaunch(args);
  }
  if (!needsFlatpakRunWrapper(program)) {
    return { program, args };
  }
  return {
    program: 'flatpak',
    args: [...FLATPAK_RUN_PREFIX, ...args],
  };
};

/** Fix legacy malformed commands: flatpak -f … run org.libretro.RetroArch … */
export const repairFlatpakLaunch = (
  args: string[],
): { program: string; args: string[] } => {
  if (args[0] === 'run' && args[1] === FLATPAK_RETROARCH_APP) {
    return { program: 'flatpak', args };
  }
  const runAt = args.indexOf('run');
  const appAt = args.indexOf(FLATPAK_RETROARCH_APP);
  if (runAt >= 0 && appAt === runAt + 1) {
    const before = args.slice(0, runAt);
    const after = args.slice(appAt + 1);
    return { program: 'flatpak', args: [...FLATPAK_RUN_PREFIX, ...before, ...after] };
  }
  return { program: 'flatpak', args: [...FLATPAK_RUN_PREFIX, ...args] };
};

export const formatLaunchCommand = (program: string, args: string[]): string =>
  [program, ...args].map((part) => (part.includes(' ') ? `"${part}"` : part)).join(' ');

/** @deprecated Use finalizeEngineLaunch after display settings. */
export const normalizeEngineLaunch = finalizeEngineLaunch;
