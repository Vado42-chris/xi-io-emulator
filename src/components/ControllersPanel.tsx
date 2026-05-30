import React, { useEffect, useState } from 'react';
import { Gamepad, RefreshCw, CheckCircle, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import {
  getControllerSnapshot,
  pollControllerDevices,
  runInputControllerTest,
  markInGameControllerVerified,
  type ControllerSnapshot,
} from '../services/controllerService';
import {
  captureShellExitButton,
  clearShellExitMapping,
  getShellExitMapping,
  saveShellExitMapping,
  type ShellExitMapping,
} from '../services/shellExitButtonService';
import { isTauriRuntime } from '../services/tauriService';

interface ControllersPanelProps {
  onSnapshotChange?: (snapshot: ControllerSnapshot) => void;
  onMappingChange?: (mapping: ShellExitMapping | null) => void;
}

export const ControllersPanel: React.FC<ControllersPanelProps> = ({
  onSnapshotChange,
  onMappingChange,
}) => {
  const [snapshot, setSnapshot] = useState<ControllerSnapshot>(getControllerSnapshot());
  const [testing, setTesting] = useState(false);
  const [pressedButtons, setPressedButtons] = useState<string[]>([]);
  const [shellExitMapping, setShellExitMapping] = useState<ShellExitMapping | null>(null);
  const [shellExitCapturing, setShellExitCapturing] = useState(false);
  const [shellExitError, setShellExitError] = useState<string | null>(null);

  useEffect(() => {
    void getShellExitMapping().then((mapping) => {
      setShellExitMapping(mapping);
      onMappingChange?.(mapping);
    });
  }, [onMappingChange]);

  useEffect(() => {
    void pollControllerDevices().then((s) => {
      setSnapshot(s);
      onSnapshotChange?.(s);
    });

    const onGamepad = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const active: string[] = [];
      pads.forEach((pad, index) => {
        if (!pad) return;
        pad.buttons.forEach((btn, btnIndex) => {
          if (btn.pressed) active.push(`Pad${index}:btn${btnIndex}`);
        });
      });
      setPressedButtons(active);
    };

    window.addEventListener('gamepadconnected', onGamepad);
    window.addEventListener('gamepaddisconnected', onGamepad);
    const interval = window.setInterval(onGamepad, 200);
    return () => {
      window.removeEventListener('gamepadconnected', onGamepad);
      window.removeEventListener('gamepaddisconnected', onGamepad);
      window.clearInterval(interval);
    };
  }, [onSnapshotChange]);

  const handleRefresh = async () => {
    const s = await pollControllerDevices();
    setSnapshot(s);
    onSnapshotChange?.(s);
  };

  const handleInputTest = async () => {
    setTesting(true);
    const s = await runInputControllerTest();
    setSnapshot(s);
    onSnapshotChange?.(s);
    setTesting(false);
  };

  const handleInGameVerified = () => {
    const s = markInGameControllerVerified();
    setSnapshot(s);
    onSnapshotChange?.(s);
  };

  const handleCaptureShellExit = async () => {
    setShellExitCapturing(true);
    setShellExitError(null);
    try {
      const captured = await captureShellExitButton(20000);
      await saveShellExitMapping(captured);
      setShellExitMapping(captured);
      onMappingChange?.(captured);
    } catch (err) {
      setShellExitError(err instanceof Error ? err.message : 'Unable to capture button.');
    } finally {
      setShellExitCapturing(false);
    }
  };

  const handleClearShellExit = async () => {
    await clearShellExitMapping();
    setShellExitMapping(null);
    onMappingChange?.(null);
    setShellExitError(null);
  };

  const hasDetection =
    snapshot.devices.length > 0 ||
    snapshot.browserGamepadCount > 0 ||
    snapshot.state === 'in_game_verified';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        className="status-card"
        style={{
          padding: '16px',
          borderLeft: `3px solid ${shellExitMapping ? '#10b981' : '#60a5fa'}`,
        }}
      >
        <h4 style={{ fontWeight: 600, marginBottom: '8px' }}>Return to Arcade (in-game exit)</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 12px 0' }}>
          {isTauriRuntime()
            ? 'Choose any button your games do not use — Guide, Home, or System is recommended. xi-io listens in the background while an emulator runs.'
            : 'Requires the Tauri desktop shell for in-game exit. Run npm run tauri:dev.'}
        </p>
        {shellExitMapping ? (
          <p style={{ fontSize: '0.85rem', margin: '0 0 12px 0' }}>
            Configured: <strong>{shellExitMapping.buttonLabel}</strong> on {shellExitMapping.deviceName}
          </p>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#fbbf24', margin: '0 0 12px 0' }}>
            Not configured yet — set this on first launch or remap below.
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            disabled={shellExitCapturing || !isTauriRuntime()}
            onClick={() => void handleCaptureShellExit()}
          >
            {shellExitCapturing ? 'Press your button now…' : shellExitMapping ? 'Remap button' : 'Choose button'}
          </button>
          {shellExitMapping && (
            <button type="button" className="btn-secondary" onClick={() => void handleClearShellExit()}>
              <RotateCcw size={14} style={{ marginRight: 6 }} /> Clear mapping
            </button>
          )}
        </div>
        {shellExitError && (
          <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '10px', marginBottom: 0 }}>{shellExitError}</p>
        )}
      </div>

      <div
        className="status-card"
        style={{
          padding: '16px',
          borderLeft: `3px solid ${hasDetection ? '#10b981' : '#fbbf24'}`,
        }}
      >
        <h4 style={{ fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasDetection ? (
            <CheckCircle size={18} style={{ color: '#10b981' }} />
          ) : (
            <AlertTriangle size={18} style={{ color: '#fbbf24' }} />
          )}
          Controller Proof State: {snapshot.state.replace(/_/g, ' ')}
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
          {isTauriRuntime()
            ? 'Linux input devices and browser Gamepad API are both checked.'
            : 'Run npm run tauri:dev for Linux /dev/input scan. Browser Gamepad API works in dev mode.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button type="button" className="btn-secondary" onClick={() => void handleRefresh()}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh Detection
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={testing}
          onClick={() => void handleInputTest()}
        >
          {testing ? 'Listening for input (5s)...' : 'Run Input Test'}
        </button>
        <button type="button" className="btn-secondary" onClick={handleInGameVerified}>
          Mark In-Game Verified
        </button>
      </div>

      {!hasDetection ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Gamepad size={32} />
          </div>
          <h3 className="empty-state-title">No Controller Detected Yet</h3>
          <p className="empty-state-description">
            Connect a USB or Bluetooth gamepad and press any button, then run Refresh Detection.
            If FCEUX already works with your pad, launch a proof NES game and use Mark In-Game Verified.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="status-card" style={{ padding: '14px' }}>
            <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>Browser Gamepads</h5>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Connected: {snapshot.browserGamepadCount}
            </p>
            {snapshot.browserGamepadLabels.map((label) => (
              <div key={label} style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                {label}
              </div>
            ))}
            {pressedButtons.length > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '8px' }}>
                Pressed: {pressedButtons.join(', ')}
              </p>
            )}
          </div>
          <div className="status-card" style={{ padding: '14px' }}>
            <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>Linux Input Devices</h5>
            {snapshot.devices.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>None listed (Tauri required)</p>
            ) : (
              snapshot.devices.map((d) => (
                <div key={d.name} style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
                  <strong>{d.name}</strong>
                  <div style={{ color: 'var(--color-text-muted)' }}>{d.handlers.join(', ')}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {snapshot.notes.length > 0 && (
        <div className="status-card" style={{ padding: '12px', fontSize: '0.8rem' }}>
          {snapshot.notes.map((note) => (
            <p key={note} style={{ margin: '0 0 6px 0', color: 'var(--color-text-muted)' }}>
              {note}
            </p>
          ))}
        </div>
      )}

      {snapshot.state === 'test_failed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
          <XCircle size={16} /> Input test did not detect a button press. Use in-game FCEUX verification if pad works there.
        </div>
      )}
    </div>
  );
};
