#!/usr/bin/env node
/**
 * Validates metadata backup JSON exports — no absolute paths, no ROM payloads.
 * Milestone: XARCADE-LIBRARY-METADATA-BACKUP-001
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_FIXTURE = path.join(
  ROOT,
  'projects/evidence/xi_io_emulator/metadata-backup-v1.example.json',
);

const ABSOLUTE_PATH = /^(\/|[A-Za-z]:\\|\\\\)/;
const HOME_LEAK = /(?:\/media\/|\/home\/|Storage 22|chrishallberg)/i;

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`OK: ${message}`);
}

function walkStrings(value, visit, keyPath = '') {
  if (typeof value === 'string') {
    visit(value, keyPath);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, visit, `${keyPath}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      walkStrings(nested, visit, keyPath ? `${keyPath}.${key}` : key);
    }
  }
}

function validateBundle(bundle) {
  if (bundle.schemaVersion !== '1.0.0') {
    fail(`unsupported schemaVersion: ${bundle.schemaVersion}`);
  }
  for (const field of ['exportId', 'exportedAt', 'sourceApp', 'libraryRoots', 'games']) {
    if (!(field in bundle)) {
      fail(`missing required field: ${field}`);
    }
  }
  if (!Array.isArray(bundle.libraryRoots) || !Array.isArray(bundle.games)) {
    fail('libraryRoots and games must be arrays');
  }

  for (const root of bundle.libraryRoots) {
    if ('path' in root) {
      fail(`library root ${root.id} must not include absolute path field in export`);
    }
    for (const required of ['id', 'label', 'systems', 'readOnlySource']) {
      if (!(required in root)) {
        fail(`library root missing ${required}`);
      }
    }
  }

  const rootIds = new Set(bundle.libraryRoots.map((root) => root.id));

  for (const game of bundle.games) {
    if ('contentPath' in game) {
      fail(`game ${game.id} must not include contentPath in export`);
    }
    for (const required of [
      'id',
      'relativePath',
      'libraryRootId',
      'dataSource',
      'provenanceLabel',
      'reviewStatus',
    ]) {
      if (!(required in game)) {
        fail(`game ${game.id ?? '?'} missing ${required}`);
      }
    }
    if (!rootIds.has(game.libraryRootId)) {
      fail(`game ${game.id} references unknown libraryRootId ${game.libraryRootId}`);
    }
    if (ABSOLUTE_PATH.test(game.relativePath)) {
      fail(`game ${game.id} relativePath looks absolute: ${game.relativePath}`);
    }
  }

  walkStrings(bundle, (text, keyPath) => {
    if (keyPath.endsWith('relativePath') && ABSOLUTE_PATH.test(text)) {
      fail(`absolute path at ${keyPath}: ${text}`);
    }
    if (HOME_LEAK.test(text) && !keyPath.includes('provenanceLabel')) {
      fail(`possible host path leak at ${keyPath}: ${text}`);
    }
  });

  pass(`structure valid (${bundle.games.length} games, ${bundle.libraryRoots.length} roots)`);
}

function main() {
  const target = process.argv[2] ?? DEFAULT_FIXTURE;
  if (!fs.existsSync(target)) {
    fail(`file not found: ${target}`);
  }

  let bundle;
  try {
    bundle = JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (error) {
    fail(`invalid JSON: ${error.message}`);
  }

  validateBundle(bundle);

  const raw = fs.readFileSync(target, 'utf8');
  if (raw.includes('"romBinary"') || raw.includes('"rom_bytes"')) {
    fail('export must not contain ROM payload fields');
  }

  pass(`no ROM payload fields in ${path.basename(target)}`);
  console.log('\nAll metadata backup export checks passed.');
}

main();
