/**
 * PRH-01 one-time localStorage → SQLite migration (Tauri only).
 *
 * Pass 11 scaffold: migration invoke lands in pass 2 after schema + ledger wiring.
 * Plan: docs/project-tracking/prh-01-sqlite-migration-plan.md
 */
import { addLedgerEvent } from './db';
import { isTauriRuntime } from './tauriService';

export type PlaySessionMigrationResult = 'skipped' | 'succeeded' | 'failed';

const MIGRATION_FLAG_KEY = 'xibalba_play_session_sqlite_migrated';

export const isPlaySessionMigrationComplete = (): boolean =>
  localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';

/** Run when Tauri boots and SQLite schema is ready (invoke added in PRH-01 pass 2). */
export const migratePlaySessionFromLocalStorage = async (): Promise<PlaySessionMigrationResult> => {
  if (!isTauriRuntime()) {
    return 'skipped';
  }
  if (isPlaySessionMigrationComplete()) {
    return 'skipped';
  }

  // PRH-01 pass 2: invoke('migrate_play_session_from_local_storage', { session, coplay })
  addLedgerEvent(
    'play_session_migration_pending',
    'Play session SQLite migration scaffold only — invoke not wired yet',
    { schemaVersion: '1.0.0' },
  );
  return 'skipped';
};
