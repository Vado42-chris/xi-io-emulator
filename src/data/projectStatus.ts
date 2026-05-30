export interface ProjectStatus {
  currentMilestone: string;
  currentSystem: string;
  currentBackendTarget: string;
  storageState: 'not configured' | 'mounted' | 'missing' | 'error' | 'configured' | 'offline';
  controllerState: 'not configured' | 'connected' | 'unmapped' | 'error';
  launchReadiness: 'not configured' | 'partial' | 'ready' | 'blocked';
  nesProofReady: 'not configured' | 'ready' | 'blocked';
  snesProofReady: 'not configured' | 'ready' | 'blocked';
  overallProofState: 'not configured' | 'partial' | 'ready' | 'blocked';
  systemLogo?: string;
}

export const initialProjectStatus: ProjectStatus = {
  currentMilestone: "XARCADE-CONTROLLER-LAUNCH-PROOF-001",
  currentSystem: "SNES",
  currentBackendTarget: "RetroArch",
  storageState: "not configured",
  controllerState: "not configured",
  launchReadiness: "not configured",
  nesProofReady: "not configured",
  snesProofReady: "not configured",
  overallProofState: "not configured",
};
