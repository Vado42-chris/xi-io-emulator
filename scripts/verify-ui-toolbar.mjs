#!/usr/bin/env node
/**
 * Ensures dist/ bundle contains styled browse-toolbar classes before Tauri loads file:// dist.
 * Fails fast when CSS/JS integration is missing (white WebKit buttons regression).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_INDEX = path.join(ROOT, 'dist', 'index.html');

function readAssetFromHtml(kind) {
  const html = fs.readFileSync(DIST_INDEX, 'utf8');
  const pattern = kind === 'css' ? /href="\.\/assets\/([^"]+\.css)"/ : /src="\.\/assets\/(index-[^"]+\.js)"/;
  const match = html.match(pattern);
  if (!match) {
    throw new Error(`dist/index.html missing ${kind} asset reference`);
  }
  return path.join(ROOT, 'dist', 'assets', match[1]);
}

function assertIncludes(label, haystack, needles) {
  for (const needle of needles) {
    if (!haystack.includes(needle)) {
      throw new Error(`${label} missing required token: ${needle}`);
    }
  }
}

function main() {
  if (!fs.existsSync(DIST_INDEX)) {
    throw new Error('dist/index.html not found — run npm run build first');
  }

  const cssPath = readAssetFromHtml('css');
  const jsPath = readAssetFromHtml('js');
  const css = fs.readFileSync(cssPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  assertIncludes('CSS bundle', css, [
    'arcade-platform-tab',
    'arcade-filter-chip',
    'arcade-toolbar',
    'ui-btn--secondary',
    'appearance',
  ]);

  assertIncludes('JS bundle', js, [
    'ui-btn ui-btn--secondary ui-btn--sm arcade-platform-tab',
    'ui-btn ui-btn--ghost ui-btn--sm arcade-filter-chip',
    'ui-input arcade-toolbar-search-input',
  ]);

  console.log('verify-ui-toolbar: ok');
  console.log(`  css: ${path.basename(cssPath)}`);
  console.log(`  js:  ${path.basename(jsPath)}`);
}

main();
