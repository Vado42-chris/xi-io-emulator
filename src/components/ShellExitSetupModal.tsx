import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Gamepad2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  captureShellExitButton,
  saveShellExitMapping,
  skipShellExitSetupThisSession,
  type ShellExitMapping,
} from '../services/shellExitButtonService';
import { listShellExitCaptureSources } from '../services/tauriService';
import { useArcadeGamepadListener } from '../hooks/useArcadeGamepadListener';
import { ShellGamepadHintRail } from './ShellGamepadHintRail';

type SetupPhase = 'intro' | 'listening' | 'success' | 'error';

interface ShellExitSetupModalProps {
  open: boolean;
  onClose: () => void;
  onConfigured: (mapping: ShellExitMapping) => void;
}

const gamepadButtonLabel = (index: number): string => {
  const labels = [
    'A / Cross',
    'B / Circle',
    'X / Square',
    'Y / Triangle',
    'L1 / LB',
    'R1 / RB',
    'L2 / LT',
    'R2 / RT',
    'Select / Back',
    'Start / Options',
    'L3',
    'R3',
    'D-pad Up',
    'D-pad Down',
    'D-pad Left',
    'D-pad Right',
    'Guide / Home / System',
  ];
  return labels[index] ?? `Button ${index}`;
};

export const ShellExitSetupModal: React.FC<ShellExitSetupModalProps> = ({
  open,
  onClose,
  onConfigured,
}) => {
  const [phase, setPhase] = useState<SetupPhase>('intro');
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ShellExitMapping | null>(null);
  const [captureSources, setCaptureSources] = useState<string | null>(null);
  const [browserPress, setBrowserPress] = useState<string | null>(null);
  const captureSessionRef = useRef(0);

  useEffect(() => {
    if (!open || phase !== 'intro') {
      return;
    }
    void listShellExitCaptureSources()
      .then(setCaptureSources)
      .catch(() => setCaptureSources(null));
  }, [open, phase]);

  useEffect(() => {
    if (!open || phase !== 'listening') {
      return;
    }

    let frame = 0;
    const tick = () => {
      const pads = navigator.getGamepads?.() ?? [];
      for (const pad of pads) {
        if (!pad) continue;
        pad.buttons.forEach((btn, index) => {
          if (btn.pressed) {
            setBrowserPress(`${gamepadButtonLabel(index)} (${pad.id || 'gamepad'})`);
          }
        });
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [open, phase]);

  const handleStartCapture = useCallback(async () => {
    const session = captureSessionRef.current + 1;
    captureSessionRef.current = session;
    setPhase('listening');
    setError(null);
    setBrowserPress(null);
    try {
      const captured = await captureShellExitButton(20000);
      if (captureSessionRef.current !== session) {
        return;
      }
      await saveShellExitMapping(captured);
      setMapping(captured);
      setPhase('success');
      onConfigured(captured);
    } catch (err) {
      if (captureSessionRef.current !== session) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to capture controller button.');
      setPhase('error');
    }
  }, [onConfigured]);

  const handleCancelCapture = useCallback(() => {
    captureSessionRef.current += 1;
    setPhase('intro');
    setBrowserPress(null);
    setError(null);
  }, []);

  const handleSkip = useCallback(() => {
    skipShellExitSetupThisSession();
    onClose();
  }, [onClose]);

  const handleContinue = useCallback(() => {
    onClose();
  }, [onClose]);

  useArcadeGamepadListener(open, {
    onConfirm: () => {
      if (phase === 'intro') {
        void handleStartCapture();
      } else if (phase === 'success') {
        handleContinue();
      } else if (phase === 'error') {
        void handleStartCapture();
      }
    },
    onBack: () => {
      if (phase === 'listening') {
        handleCancelCapture();
        return;
      }
      handleSkip();
    },
    onMenu: () => {
      if (phase === 'success') {
        handleContinue();
      } else if (phase === 'intro' || phase === 'error') {
        void handleStartCapture();
      }
    },
  });

  if (!open) {
    return null;
  }

  const shellHints =
    phase === 'success'
      ? [
          { button: 'A', label: 'Continue to Arcade', tone: 'confirm' as const },
          { button: 'Start', label: 'Continue to Arcade', tone: 'menu' as const },
          { button: 'B', label: 'Close', tone: 'back' as const },
        ]
      : phase === 'intro'
        ? [
            { button: 'A', label: 'Choose button now', tone: 'confirm' as const },
            { button: 'Start', label: 'Choose button now', tone: 'menu' as const },
            { button: 'B', label: 'Skip for now', tone: 'back' as const },
          ]
        : phase === 'error'
          ? [
              { button: 'A', label: 'Try again', tone: 'confirm' as const },
              { button: 'Start', label: 'Try again', tone: 'menu' as const },
              { button: 'B', label: 'Skip for now', tone: 'back' as const },
            ]
          : [
              { button: 'B', label: 'Cancel setup', tone: 'back' as const },
            ];

  return (
    <div className="shell-exit-setup-backdrop" role="dialog" aria-modal="true" aria-labelledby="shell-exit-setup-title">
      <div className="shell-exit-setup-modal">
        <button type="button" className="shell-exit-setup-close" onClick={handleSkip} aria-label="Close">
          <X size={18} />
        </button>

        <div className="shell-exit-setup-icon">
          <Gamepad2 size={28} />
        </div>

        <h2 id="shell-exit-setup-title" className="shell-exit-setup-title">
          Set your Return to Arcade button
        </h2>

        {phase === 'intro' && (
          <>
            <p className="shell-exit-setup-desc">
              Choose any controller button that your games do not use — Guide, Home, or System is ideal on
              modern pads. Original NES and SNES controllers had no equivalent, so this will not interfere with
              gameplay.
            </p>
            <p className="shell-exit-setup-desc shell-exit-setup-desc-muted">
              While a game is running, xi-io listens for this button in the background and returns you to Arcade
              Home. You can change it later in Admin → Controllers.
            </p>
            {captureSources && (
              <p className="shell-exit-setup-desc shell-exit-setup-desc-muted" style={{ fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                Native input sources:
                {'\n'}
                {captureSources}
              </p>
            )}
            <div className="shell-exit-setup-actions">
              <button type="button" className="btn-primary" onClick={() => void handleStartCapture()}>
                Choose button now
              </button>
              <button type="button" className="btn-secondary" onClick={handleSkip}>
                Skip for now
              </button>
            </div>
            <ShellGamepadHintRail hints={shellHints} />
          </>
        )}

        {phase === 'listening' && (
          <>
            <p className="shell-exit-setup-desc">
              Press the button you want to use to exit games and return to Arcade.
            </p>
            <div className="shell-exit-setup-listening">
              <span className="launch-overlay-spinner" />
              <span>Listening for native input…</span>
            </div>
            {browserPress ? (
              <p className="shell-exit-setup-desc" style={{ color: '#6ee7b7', marginTop: '12px' }}>
                Browser sees: {browserPress}
              </p>
            ) : (
              <p className="shell-exit-setup-desc shell-exit-setup-desc-muted" style={{ marginTop: '12px' }}>
                If nothing appears here when you press buttons, wake the gamepad with any button first.
              </p>
            )}
            <ShellGamepadHintRail hints={shellHints} />
          </>
        )}

        {phase === 'success' && mapping && (
          <>
            <div className="shell-exit-setup-success">
              <CheckCircle size={18} />
              <span>
                Saved: <strong>{mapping.buttonLabel}</strong> on {mapping.deviceName}
              </span>
            </div>
            <p className="shell-exit-setup-desc shell-exit-setup-desc-muted">
              Press this button any time a game is running to return to Arcade Home.
            </p>
            <div className="shell-exit-setup-actions">
              <button type="button" className="btn-primary" onClick={handleContinue}>
                Continue to Arcade
              </button>
            </div>
            <ShellGamepadHintRail hints={shellHints} />
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="shell-exit-setup-error">
              <AlertTriangle size={18} />
              <span>{error ?? 'Capture failed.'}</span>
            </div>
            {browserPress && (
              <p className="shell-exit-setup-desc shell-exit-setup-desc-muted">
                Browser detected {browserPress}, but native Linux input did not. You may need input-group access on
                /dev/input/event*.
              </p>
            )}
            <div className="shell-exit-setup-actions">
              <button type="button" className="btn-primary" onClick={() => void handleStartCapture()}>
                Try again
              </button>
              <button type="button" className="btn-secondary" onClick={handleSkip}>
                Skip for now
              </button>
            </div>
            <ShellGamepadHintRail hints={shellHints} />
          </>
        )}
      </div>
    </div>
  );
};
