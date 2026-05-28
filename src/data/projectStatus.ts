export interface ProjectStatus {
  currentMilestone: string;
  currentSystem: string;
  currentBackendTarget: string;
  storageState: 'not configured' | 'mounted' | 'missing' | 'error';
  controllerState: 'not configured' | 'connected' | 'unmapped' | 'error';
  launchReadiness: 'not configured' | 'ready' | 'blocked';
  systemLogo?: string;
}

export const initialProjectStatus: ProjectStatus = {
  currentMilestone: "XARCADE-ARCADE-HOME-001",
  currentSystem: "SNES",
  currentBackendTarget: "RetroArch",
  storageState: "not configured",
  controllerState: "not configured",
  launchReadiness: "not configured",
};
