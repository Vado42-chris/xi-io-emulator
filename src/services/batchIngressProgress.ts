import type { BatchIngressProgress } from '../data/gameModels';

type ProgressListener = (progress: BatchIngressProgress | null) => void;

let currentProgress: BatchIngressProgress | null = null;
const listeners = new Set<ProgressListener>();

export const getBatchIngressProgress = (): BatchIngressProgress | null => currentProgress;

export const subscribeBatchIngressProgress = (listener: ProgressListener): (() => void) => {
  listeners.add(listener);
  listener(currentProgress);
  return () => listeners.delete(listener);
};

const emit = (): void => {
  for (const listener of listeners) {
    listener(currentProgress);
  }
};

export const startBatchIngressProgress = (
  folderPath: string,
  filesTotal: number,
): BatchIngressProgress => {
  currentProgress = {
    scanId: `scan_${Date.now()}`,
    folderPath,
    status: 'running',
    filesTotal,
    filesProcessed: 0,
    gamesAdded: 0,
    gamesUpdated: 0,
    gamesSkipped: 0,
    gamesFullyIngested: 0,
    startedAt: new Date().toISOString(),
  };
  emit();
  return currentProgress;
};

export const updateBatchIngressProgress = (
  patch: Partial<BatchIngressProgress>,
): BatchIngressProgress | null => {
  if (!currentProgress) return null;
  currentProgress = { ...currentProgress, ...patch };
  emit();
  return currentProgress;
};

export const completeBatchIngressProgress = (
  patch: Partial<BatchIngressProgress> = {},
): BatchIngressProgress | null => {
  if (!currentProgress) return null;
  currentProgress = {
    ...currentProgress,
    ...patch,
    status: patch.status ?? 'completed',
    completedAt: new Date().toISOString(),
  };
  emit();
  return currentProgress;
};

export const clearBatchIngressProgress = (): void => {
  currentProgress = null;
  emit();
};
