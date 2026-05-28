// #xar:controller-launch-proof/current
import { getEngineSettings, getProofGameSettings } from './db';
import { checkPathExists, isTauriRuntime } from './tauriService';

export type ProofReadinessState = 'not configured' | 'ready' | 'blocked';

export interface ProofReadinessSummary {
  nesProofReady: ProofReadinessState;
  snesProofReady: ProofReadinessState;
  overallProofState: 'not configured' | 'partial' | 'ready' | 'blocked';
}

const pathReady = async (contentPath?: string): Promise<boolean> => {
  if (!contentPath?.trim()) return false;
  if (!isTauriRuntime()) return true;
  const check = await checkPathExists(contentPath);
  return check.exists;
};

export const computeProofReadiness = async (): Promise<ProofReadinessSummary> => {
  const engine = getEngineSettings();
  const proof = getProofGameSettings();

  const hasFceux = Boolean(engine.fceuxBinaryPath && engine.fceuxBinaryPath !== 'Not set');
  const hasRetroArch = Boolean(
    engine.retroarchBinaryPath && engine.retroarchBinaryPath !== 'Not set'
  );
  const hasCore = Boolean(engine.snesCorePath && engine.snesCorePath !== 'Not set');

  let nesProofReady: ProofReadinessState = 'not configured';
  if (proof.nesGameId && proof.nesContentPath) {
    if (!hasFceux) {
      nesProofReady = 'blocked';
    } else {
      nesProofReady = (await pathReady(proof.nesContentPath)) ? 'ready' : 'blocked';
    }
  } else if (hasFceux) {
    nesProofReady = 'not configured';
  }

  let snesProofReady: ProofReadinessState = 'not configured';
  if (proof.snesGameId && proof.snesContentPath) {
    if (!hasRetroArch || !hasCore) {
      snesProofReady = 'blocked';
    } else {
      snesProofReady = (await pathReady(proof.snesContentPath)) ? 'ready' : 'blocked';
    }
  } else if (hasRetroArch && hasCore) {
    snesProofReady = 'not configured';
  }

  let overallProofState: ProofReadinessSummary['overallProofState'] = 'not configured';
  if (nesProofReady === 'ready' && snesProofReady === 'ready') {
    overallProofState = 'ready';
  } else if (nesProofReady === 'ready' || snesProofReady === 'ready') {
    overallProofState = 'partial';
  } else if (nesProofReady === 'blocked' || snesProofReady === 'blocked') {
    overallProofState = 'blocked';
  }

  return { nesProofReady, snesProofReady, overallProofState };
};

export const launchReadinessFromProof = (
  summary: ProofReadinessSummary
): 'not configured' | 'partial' | 'ready' | 'blocked' => summary.overallProofState;
