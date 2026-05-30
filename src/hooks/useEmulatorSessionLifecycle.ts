import { useEffect, useRef } from 'react';
import {
  isTauriRuntime,
  onEmulatorSessionFinished,
  onEmulatorSessionStarted,
  type EmulatorSessionFinishedPayload,
} from '../services/tauriService';

export interface EmulatorSessionLifecycleHandlers {
  onSessionStarted?: (sessionId: string) => void;
  onSessionFinished?: (payload: EmulatorSessionFinishedPayload) => void;
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

    return () => {
      unlistenStarted?.();
      unlistenFinished?.();
    };
  }, []);
};
