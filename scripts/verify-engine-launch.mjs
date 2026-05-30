import {
  finalizeEngineLaunch,
  formatLaunchCommand,
  repairFlatpakLaunch,
} from '../src/services/engineLaunchService.ts';

const internalPath =
  '/home/user/.local/share/flatpak/app/org.libretro.RetroArch/current/active/files/bin/retroarch';
const core =
  '/home/user/.var/app/org.libretro.RetroArch/config/retroarch/cores/bsnes2014_balanced_libretro.so';
const rom = '/media/roms/Super Mario World (U) [!].smc';

// 1) Internal Flatpak path wraps correctly
const baseArgs = ['-f', '-L', core, rom];
const wrapped = finalizeEngineLaunch(internalPath, baseArgs);
console.assert(wrapped.program === 'flatpak', 'internal path should wrap to flatpak');
console.assert(wrapped.args[0] === 'run', 'should start with run');
console.assert(wrapped.args[1] === 'org.libretro.RetroArch', 'should include app id');
console.assert(wrapped.args[2] === '-f', 'display flags should follow app id');

// 2) Display settings must not break flatpak run order
const displayFirst = repairFlatpakLaunch([
  '-f',
  '--video-fullscreen-screen',
  '0',
  'run',
  'org.libretro.RetroArch',
  '-L',
  core,
  rom,
]);
console.assert(displayFirst.args[0] === 'run', 'repair: run first');
console.assert(displayFirst.args[2] === '-f', 'repair: flags after app id');

// 3) Final command string shape
const cmd = formatLaunchCommand(wrapped.program, wrapped.args);
console.assert(!cmd.startsWith('flatpak -f'), 'flags must not precede run');
console.assert(cmd.includes('flatpak run org.libretro.RetroArch'), 'valid flatpak invocation');

console.log('verify-engine-launch: ok');
console.log(cmd);
