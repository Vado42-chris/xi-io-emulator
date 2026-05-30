/**
 * Tauri `emulator-session-started` / `emulator-session-finished` / shell focus restore wiring.
 * UI must not call shell restore directly — Rust owns restore (XIO-LCH-008).
 */
import { useEffect, useRef } from 'react';
import {
  isTauriRuntime,
  onEmulatorSessionFinished,
  onEmulatorSessionStarted,
  onShellFocusRestoreFailed,
  onShellFocusRestored,
  type EmulatorSessionFinishedPayload,
  type ShellFocusRestorePayload,
} from '../services/tauriService';

export interface EmulatorSessionLifecycleHandlers {
  onSessionStarted?: (sessionId: string) => void;
  onSessionFinished?: (payload: EmulatorSessionFinishedPayload) => void;
  onShellFocusRestored?: (payload: ShellFocusRestorePayload) => void;
  onShellFocusRestoreFailed?: (payload: ShellFocusRestorePayload) => void;
}

/** Shared Tauri session event wiring for ArcadeHome, AppShell admin launches, etc. */
export const useEmulatorSessionLifecycle = (handlers: EmulatorSessionLifecycleHandlers): void => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    let unlistenStarted: (() => void) | undefined;
    let unlistenFinished: (() => void) | undefined;
    let unlistenShellRestored: (() => void) | undefined;
    let unlistenShellRestoreFailed: (() => void) | undefined;

    void onEmulatorSessionStarted((payload) => {
      handlersRef.current.onSessionStarted?.(payload.sessionId);
    }).then((dispose) => {
      unlistenStarted = dispose;
    });

    void onEmulatorSessionFinished((payload) => {
      handlersRef.current.onSessionFinished?.(payload);
    }).then((dispose) => {
      unlistenFinished = dispose;
    });

    void onShellFocusRestored((payload) => {
      handlersRef.current.onShellFocusRestored?.(payload);
    }).then((dispose) => {
      unlistenShellRestored = dispose;
    });

    void onShellFocusRestoreFailed((payload) => {
      handlersRef.current.onShellFocusRestoreFailed?.(payload);
    }).then((dispose) => {
      unlistenShellRestoreFailed = dispose;
    });

    return () => {
      unlistenStarted?.();
      unlistenFinished?.();
      unlistenShellRestored?.();
      unlistenShellRestoreFailed?.();
    };
  }, []);
};
