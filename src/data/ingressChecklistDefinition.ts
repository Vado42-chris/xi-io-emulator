import type { IngressChecklistStepId } from './gameModels';

export interface IngressChecklistStepDefinition {
  id: IngressChecklistStepId;
  label: string;
  description: string;
  required: boolean;
  /** Skip when ingress mode is single_game (no library root). */
  batchOnly?: boolean;
}

/** Formal gate checklist — every game must pass required steps before "fully ingressed". */
export const INGRESS_CHECKLIST_STEPS: IngressChecklistStepDefinition[] = [
  {
    id: 'path_recorded',
    label: 'Path recorded',
    description: 'Content path and filename stored on the game record.',
    required: true,
  },
  {
    id: 'extension_valid',
    label: 'Extension valid',
    description: 'ROM extension matches the declared system adapter.',
    required: true,
  },
  {
    id: 'file_verified',
    label: 'File on disk',
    description: 'ROM file exists at the recorded path (Tauri runtime).',
    required: true,
  },
  {
    id: 'title_normalized',
    label: 'Title normalized',
    description: 'Display title and sort key derived from filename.',
    required: true,
  },
  {
    id: 'identity_resolved',
    label: 'Identity resolved',
    description: 'System, region, and showcase tags assigned.',
    required: true,
  },
  {
    id: 'artwork_assigned',
    label: 'Artwork assigned',
    description: 'Box art / snap URLs or fallback mapping attached.',
    required: true,
  },
  {
    id: 'artwork_verified',
    label: 'Artwork verified',
    description: 'Primary box art URL responds (remote HEAD check).',
    required: true,
  },
  {
    id: 'library_root_linked',
    label: 'Library root linked',
    description: 'Batch games linked to a registered, mounted library root.',
    required: true,
    batchOnly: true,
  },
  {
    id: 'engine_ready',
    label: 'Engine configured',
    description: 'Emulator binary and core paths valid for this system.',
    required: true,
  },
  {
    id: 'launch_ready',
    label: 'Launch ready',
    description: 'All launch blockers cleared — game can start.',
    required: true,
  },
];

export const getRequiredChecklistSteps = (
  ingressMode: 'single_game' | 'batch_library',
): IngressChecklistStepDefinition[] =>
  INGRESS_CHECKLIST_STEPS.filter(
    (step) => step.required && !(step.batchOnly && ingressMode === 'single_game'),
  );
