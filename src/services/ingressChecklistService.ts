import type {
  GameIngressChecklist,
  GameRecord,
  IngressChecklistStep,
  IngressChecklistStepStatus,
} from '../data/gameModels';
import { getRequiredChecklistSteps, INGRESS_CHECKLIST_STEPS } from '../data/ingressChecklistDefinition';
import { isSupportedForSystem } from './ingressService';
import { getArtworkMappingForGame, resolveVerifiedArtworkForGame } from './artworkProvider';
import { checkLaunchReadiness } from './launchService';
import { getAdapterForSystem, validateAdapterReadiness } from './adapterService';
import { getEngineSettings, getLibraryRoots, getGameRecords, saveGameRecord } from './db';
import { checkPathExists, isTauriRuntime } from './tauriService';

export interface IngressValidationResult {
  game: GameRecord;
  checklist: GameIngressChecklist;
}

export interface LibraryIngressSummary {
  total: number;
  fullyIngested: number;
  partial: number;
  failed: number;
  percentComplete: number;
}

const nowIso = (): string => new Date().toISOString();

const makeStep = (
  id: IngressChecklistStep['id'],
  label: string,
  status: IngressChecklistStepStatus,
  message?: string,
): IngressChecklistStep => ({
  id,
  label,
  status,
  message,
  updatedAt: nowIso(),
});

const summarizeChecklist = (
  steps: IngressChecklistStep[],
  ingressMode: GameRecord['ingressMode'],
): GameIngressChecklist => {
  const required = getRequiredChecklistSteps(ingressMode);
  const requiredIds = new Set(required.map((step) => step.id));
  const requiredSteps = steps.filter((step) => requiredIds.has(step.id));
  const passedCount = requiredSteps.filter(
    (step) => step.status === 'passed' || step.status === 'warning',
  ).length;
  const totalRequired = required.length;
  const complete = requiredSteps.every(
    (step) => step.status === 'passed' || step.status === 'skipped' || step.status === 'warning',
  ) && requiredSteps.every((step) => step.status !== 'failed' && step.status !== 'pending');
  return {
    steps,
    complete,
    passedCount,
    totalRequired,
    percentComplete: totalRequired === 0 ? 0 : Math.round((passedCount / totalRequired) * 100),
    lastValidatedAt: nowIso(),
  };
};

const deriveLaunchStatus = (checklist: GameIngressChecklist): GameRecord['launchStatus'] => {
  const launchStep = checklist.steps.find((step) => step.id === 'launch_ready');
  const engineStep = checklist.steps.find((step) => step.id === 'engine_ready');
  if (launchStep?.status === 'passed') return 'ready';
  if (engineStep?.status === 'failed') return 'not_configured';
  if (launchStep?.status === 'failed') return 'blocked';
  return 'not_configured';
};

const deriveIdentityStatus = (checklist: GameIngressChecklist): GameRecord['identityStatus'] => {
  const titleStep = checklist.steps.find((step) => step.id === 'title_normalized');
  const identityStep = checklist.steps.find((step) => step.id === 'identity_resolved');
  if (titleStep?.status === 'passed' && identityStep?.status === 'passed') {
    return 'normalized';
  }
  return 'raw';
};

const syncIngressTags = (game: GameRecord, checklist: GameIngressChecklist): string[] => {
  const withoutIngress = game.tags.filter(
    (tag) =>
      !tag.startsWith('ingress:') &&
      !tag.startsWith('launch:') &&
      !tag.startsWith('identity:') &&
      !tag.startsWith('artwork:'),
  );
  const tags = [...withoutIngress];
  tags.push(`ingress:${checklist.complete ? 'complete' : 'partial'}`);
  tags.push(`identity:${deriveIdentityStatus(checklist)}`);
  tags.push(`launch:${deriveLaunchStatus(checklist)}`);
  const artworkStep = checklist.steps.find((step) => step.id === 'artwork_verified');
  if (artworkStep?.status === 'passed') tags.push('artwork:verified');
  else if (artworkStep?.status === 'warning') tags.push('artwork:fallback');
  else tags.push('artwork:missing');
  return Array.from(new Set(tags));
};

/** Validate one game against the formal ingress checklist and persist updates. */
export const validateGameIngress = async (game: GameRecord): Promise<IngressValidationResult> => {
  const definitions = getRequiredChecklistSteps(game.ingressMode);
  const steps: IngressChecklistStep[] = [];

  for (const def of INGRESS_CHECKLIST_STEPS) {
    const required = definitions.some((item) => item.id === def.id);
    if (!required && def.batchOnly && game.ingressMode === 'single_game') {
      steps.push(makeStep(def.id, def.label, 'skipped', 'Not required for single-game ingress'));
      continue;
    }
    if (!required && def.batchOnly) {
      steps.push(makeStep(def.id, def.label, 'skipped', 'Not required'));
      continue;
    }

    switch (def.id) {
      case 'path_recorded': {
        const ok = Boolean(game.contentPath?.trim() && game.originalFileName?.trim());
        steps.push(
          makeStep(
            def.id,
            def.label,
            ok ? 'passed' : 'failed',
            ok ? game.contentPath : 'Missing content path or filename',
          ),
        );
        break;
      }
      case 'extension_valid': {
        const ok = isSupportedForSystem(game.fileExtension, game.systemId);
        steps.push(
          makeStep(
            def.id,
            def.label,
            ok ? 'passed' : 'failed',
            ok ? `${game.fileExtension} supported for ${game.systemId}` : 'Unsupported extension',
          ),
        );
        break;
      }
      case 'file_verified': {
        if (!isTauriRuntime()) {
          steps.push(makeStep(def.id, def.label, 'warning', 'File check skipped outside Tauri runtime'));
          break;
        }
        const check = await checkPathExists(game.contentPath);
        const ok = check.exists && check.is_file;
        steps.push(
          makeStep(
            def.id,
            def.label,
            ok ? 'passed' : 'failed',
            ok ? 'ROM file found on disk' : 'ROM file not found at recorded path',
          ),
        );
        break;
      }
      case 'title_normalized': {
        const ok = Boolean(game.title?.trim() && game.sortTitle?.trim());
        steps.push(
          makeStep(
            def.id,
            def.label,
            ok ? 'passed' : 'failed',
            ok ? game.title : 'Title normalization incomplete',
          ),
        );
        break;
      }
      case 'identity_resolved': {
        const hasSystemTag = game.tags.some((tag) => tag.startsWith('system:'));
        const ok = hasSystemTag && game.systemId.length > 0;
        steps.push(
          makeStep(
            def.id,
            def.label,
            ok ? 'passed' : 'failed',
            ok ? `System ${game.systemId}` : 'Missing system identity tags',
          ),
        );
        break;
      }
      case 'artwork_assigned':
      case 'artwork_verified': {
        // Handled after async artwork resolution below.
        break;
      }
      case 'library_root_linked': {
        if (game.ingressMode === 'single_game') {
          steps.push(makeStep(def.id, def.label, 'skipped', 'Single-game ingress'));
          break;
        }
        const roots = getLibraryRoots();
        const root = roots.find((item) => item.id === game.libraryRootId);
        const ok = Boolean(root && root.mounted && !root.permissionDenied);
        steps.push(
          makeStep(
            def.id,
            def.label,
            ok ? 'passed' : 'failed',
            ok ? root?.label : 'Library root missing, offline, or permission denied',
          ),
        );
        break;
      }
      case 'engine_ready': {
        const adapter = getAdapterForSystem(game.systemId);
        if (!adapter) {
          steps.push(makeStep(def.id, def.label, 'failed', 'No adapter for system'));
          break;
        }
        const settings = getEngineSettings();
        const validation = await validateAdapterReadiness(adapter, settings, game.contentPath);
        steps.push(
          makeStep(
            def.id,
            def.label,
            validation.ready ? 'passed' : 'failed',
            validation.ready ? adapter.display_name : validation.missing.join('; '),
          ),
        );
        break;
      }
      case 'launch_ready': {
        const readiness = await checkLaunchReadiness(game);
        steps.push(
          makeStep(
            def.id,
            def.label,
            readiness.ready ? 'passed' : 'failed',
            readiness.ready
              ? 'Launch blockers cleared'
              : readiness.blockers.map((blocker) => blocker.desc).join('; '),
          ),
        );
        break;
      }
      default:
        steps.push(makeStep(def.id, def.label, 'pending'));
    }
  }

  const artworkResult = await resolveVerifiedArtworkForGame({
    title: game.title,
    systemId: game.systemId,
    originalFileName: game.originalFileName,
  });

  const assignedIndex = steps.findIndex((step) => step.id === 'artwork_assigned');
  const verifiedIndex = steps.findIndex((step) => step.id === 'artwork_verified');
  const hasArtwork = Boolean(artworkResult.artwork.boxart);

  if (assignedIndex >= 0) {
    steps[assignedIndex] = makeStep(
      'artwork_assigned',
      'Artwork assigned',
      hasArtwork ? 'passed' : 'failed',
      hasArtwork
        ? artworkResult.source === 'filename'
          ? 'Matched by ROM filename'
          : 'Matched by title'
        : 'No artwork mapping found',
    );
  }

  if (verifiedIndex >= 0) {
    steps[verifiedIndex] = makeStep(
      'artwork_verified',
      'Artwork verified',
      !hasArtwork ? 'failed' : artworkResult.verified ? 'passed' : 'warning',
      !hasArtwork
        ? 'No box art URL to verify'
        : artworkResult.verified
          ? 'Remote box art responds OK'
          : 'Assigned artwork URL did not respond — using fallback mapping',
    );
  }

  const checklist = summarizeChecklist(steps, game.ingressMode);
  const updated: GameRecord = {
    ...game,
    mappings: {
      ...game.mappings,
      artwork: hasArtwork ? artworkResult.artwork : getArtworkMappingForGame(game),
    },
    identityStatus: deriveIdentityStatus(checklist),
    launchStatus: deriveLaunchStatus(checklist),
    tags: syncIngressTags(game, checklist),
    ingressChecklist: checklist,
    hasHacks:
      game.hasHacks ||
      /\(.*hack.*\)/i.test(game.originalFileName) ||
      game.tags.includes('showcase:hack'),
    updatedAt: nowIso(),
  };

  saveGameRecord(updated);
  return { game: updated, checklist };
};

/** Validate every game record and return aggregate library progress. */
export const reconcileAllGamesIngress = async (): Promise<{
  games: GameRecord[];
  summary: LibraryIngressSummary;
}> => {
  const records = getGameRecords();
  const updatedGames: GameRecord[] = [];

  for (const game of records) {
    const result = await validateGameIngress(game);
    updatedGames.push(result.game);
  }

  return {
    games: updatedGames,
    summary: summarizeLibraryIngress(updatedGames),
  };
};

export const summarizeLibraryIngress = (games: GameRecord[]): LibraryIngressSummary => {
  const visible = games.filter((game) => !game.hidden);
  const fullyIngested = visible.filter((game) => game.ingressChecklist?.complete).length;
  const failed = visible.filter(
    (game) => game.ingressChecklist && !game.ingressChecklist.complete && game.ingressChecklist.percentComplete < 50,
  ).length;
  const partial = visible.length - fullyIngested - failed;
  return {
    total: visible.length,
    fullyIngested,
    partial,
    failed,
    percentComplete:
      visible.length === 0 ? 0 : Math.round((fullyIngested / visible.length) * 100),
  };
};