import { platformLabel } from './arcadeCatalogService';
import { getAdapterForSystem, validateAdapterReadiness } from './adapterService';
import { getEngineSettings } from './db';

export interface SystemEngineStatus {
  systemId: string;
  systemLabel: string;
  adapterId?: string;
  engineLabel: string;
  ready: boolean;
  missing: string[];
  adminHint: string;
}

export async function getSystemEngineStatus(
  systemId: string,
  contentPath?: string,
): Promise<SystemEngineStatus> {
  const systemLabel = platformLabel(systemId);
  const adapter = getAdapterForSystem(systemId);

  if (!adapter) {
    return {
      systemId,
      systemLabel,
      engineLabel: 'Unsupported platform',
      ready: false,
      missing: [`No launch adapter registered for ${systemLabel}.`],
      adminHint: 'Engine support for this platform is not wired yet. Check Admin → Engines.',
    };
  }

  const check = await validateAdapterReadiness(adapter, getEngineSettings(), contentPath);

  return {
    systemId,
    systemLabel,
    adapterId: adapter.adapter_id,
    engineLabel: adapter.display_name,
    ready: check.ready,
    missing: check.missing,
    adminHint: `Open Admin → Engines to configure ${adapter.display_name}.`,
  };
}

export function formatEngineStatusTitle(status: SystemEngineStatus): string {
  if (status.ready) {
    return `${status.systemLabel} engine ready`;
  }
  if (status.missing.length === 1) {
    return `Missing ${status.systemLabel} engine: ${status.missing[0]}`;
  }
  return `${status.systemLabel} engine not configured`;
}

export function formatEngineStatusSummary(status: SystemEngineStatus): string {
  if (status.ready) {
    return status.engineLabel;
  }
  return status.missing.join(' · ');
}
