#!/usr/bin/env node
/**
 * Tauri beforeDevCommand: build frontend once, then watch for changes.
 * Keeps the process alive so `tauri dev` can attach; shell loads bundled dist
 * (no localhost dev-server dependency).
 */
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_INDEX = path.join(ROOT, 'dist', 'index.html');

function runBuild() {
  console.log('[xi-io] building frontend for Tauri shell…');
  execSync('npm run build', {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      TAURI_ENV_PLATFORM: process.env.TAURI_ENV_PLATFORM ?? 'linux',
    },
  });
}

function assertDist() {
  if (!fs.existsSync(DIST_INDEX)) {
    throw new Error(`Expected ${DIST_INDEX} after build`);
  }
  const html = fs.readFileSync(DIST_INDEX, 'utf8');
  if (html.includes('src="/assets/') || html.includes('href="/assets/')) {
    throw new Error(
      'dist/index.html uses absolute /assets paths — set base: "./" in vite.config.ts',
    );
  }
  console.log('[xi-io] frontend bundle ready at dist/index.html');
}

async function main() {
  runBuild();
  assertDist();

  const watch = spawn('npx', ['vite', 'build', '--watch'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      TAURI_ENV_PLATFORM: process.env.TAURI_ENV_PLATFORM ?? 'linux',
    },
  });

  watch.on('error', (err) => {
    console.error(`[xi-io] vite build --watch failed: ${err.message}`);
    process.exit(1);
  });

  const shutdown = (signal) => {
    watch.kill(signal);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  watch.on('exit', (code, signal) => {
    if (signal) {
      process.exit(0);
    }
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error('[xi-io]', err.message ?? err);
  process.exit(1);
});
