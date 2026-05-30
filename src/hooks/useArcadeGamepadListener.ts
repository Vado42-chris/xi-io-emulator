import { useEffect, useRef } from 'react';
import {
  mergeArcadeGamepadEdges,
  pollArcadeGamepadEdges,
  type ArcadeGamepadEdges,
  type ArcadeGamepadPollState,
} from '../services/arcadeGamepadService';
import { isTauriRuntime } from '../services/tauriService';

export interface ArcadeGamepadHandlers {
  /** Preferred for complex navigation — receives merged browser + native edges. */
  onEdges?: (edges: ArcadeGamepadEdges) => void;
  onConfirm?: () => void;
  onBack?: () => void;
  onMenu?: () => void;
  onFavorite?: () => void;
  onSearch?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
}

const dispatchEdges = (edges: ArcadeGamepadEdges, handlers: ArcadeGamepadHandlers): void => {
  if (edges.up) handlers.onUp?.();
  if (edges.down) handlers.onDown?.();
  if (edges.left) handlers.onLeft?.();
  if (edges.right) handlers.onRight?.();
  if (edges.confirm) handlers.onConfirm?.();
  if (edges.back) handlers.onBack?.();
  if (edges.menu) handlers.onMenu?.();
  if (edges.favorite) handlers.onFavorite?.();
  if (edges.search) handlers.onSearch?.();
};

/** Polls browser Gamepad API plus native Linux evdev (Tauri) for shell navigation. */
export const useArcadeGamepadListener = (
  enabled: boolean,
  handlers: ArcadeGamepadHandlers
): void => {
  const pollRef = useRef<ArcadeGamepadPollState>({
    connected: false,
    label: '',
    pressed: [],
    axes: [],
  });
  const handlersRef = useRef(handlers);
  const nativeQueueRef = useRef<ArcadeGamepadEdges[]>([]);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled || !isTauriRuntime()) {
      return;
    }

    let unlisten: (() => void) | undefined;
    void import('@tauri-apps/api/event')
      .then(({ listen }) =>
        listen<ArcadeGamepadEdges>('shell-gamepad-edges', (event) => {
          nativeQueueRef.current.push(event.payload);
        })
      )
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      pollRef.current = { connected: false, label: '', pressed: [], axes: [] };
      nativeQueueRef.current = [];
      return;
    }

    pollRef.current = { connected: false, label: '', pressed: [], axes: [] };

    let frame = 0;
    const tick = () => {
      const { edges: browserEdges, state } = pollArcadeGamepadEdges(pollRef.current);
      pollRef.current = state;

      let nativeEdges = nativeQueueRef.current.reduce(
        (acc, edge) => mergeArcadeGamepadEdges(acc, edge),
        {
          up: false,
          down: false,
          left: false,
          right: false,
          confirm: false,
          back: false,
          favorite: false,
          search: false,
          menu: false,
        } as ArcadeGamepadEdges
      );
      nativeQueueRef.current = [];

      if (state.connected) {
        nativeEdges = {
          up: false,
          down: false,
          left: false,
          right: false,
          confirm: false,
          back: false,
          favorite: false,
          search: false,
          menu: false,
        };
      }

      const edges = mergeArcadeGamepadEdges(browserEdges, nativeEdges);
      const h = handlersRef.current;
      if (h.onEdges) {
        h.onEdges(edges);
      } else {
        dispatchEdges(edges, h);
      }

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [enabled]);
};
