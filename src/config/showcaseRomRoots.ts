/**
 * Showcase ROM roots — never commit machine-specific paths here.
 * Set VITE_* vars in `.env.local` (gitignored); see `.env.local.example`.
 */

const PLACEHOLDER_NES_USA = '/path/to/your/nes/roms/USA';
const PLACEHOLDER_NES_HACKS = '/path/to/your/nes/roms/Hacks';
const PLACEHOLDER_SNES = '/path/to/your/snes/roms';

export const NES_SHOWCASE_ROM_ROOT =
  (import.meta.env.VITE_NES_SHOWCASE_ROM_ROOT as string | undefined)?.trim() ||
  PLACEHOLDER_NES_USA;

export const NES_SHOWCASE_HACK_ROOT =
  (import.meta.env.VITE_NES_SHOWCASE_HACK_ROOT as string | undefined)?.trim() ||
  PLACEHOLDER_NES_HACKS;

export const SNES_SHOWCASE_ROM_ROOT =
  (import.meta.env.VITE_SNES_SHOWCASE_ROM_ROOT as string | undefined)?.trim() ||
  PLACEHOLDER_SNES;

/** True when operator configured roots via `.env.local` (not placeholder defaults). */
export function showcaseRomRootsConfigured(): boolean {
  return !NES_SHOWCASE_ROM_ROOT.startsWith('/path/to/your');
}
