import React, { useCallback, useMemo, useState } from 'react';
import { Monitor, Maximize2, RectangleHorizontal } from 'lucide-react';
import type { GameRecord } from '../data/gameModels';
import type { ConnectedDisplay } from '../services/tauriService';
import {
  WINDOW_SIZE_PRESETS,
  type LaunchDisplaySettings,
  saveLaunchDisplaySettings,
} from '../services/launchDisplayService';
import { useArcadeGamepadListener } from '../hooks/useArcadeGamepadListener';
import { identifyConnectedDisplays } from '../services/tauriService';
import { ShellGamepadHintRail } from './ShellGamepadHintRail';

type PickerSection = 'mode' | 'display' | 'size' | 'remember';

interface LaunchDisplayOverlayProps {
  game: GameRecord;
  displays: ConnectedDisplay[];
  initialSettings: LaunchDisplaySettings;
  onConfirm: (settings: LaunchDisplaySettings) => void;
  onCancel: () => void;
}

export const LaunchDisplayOverlay: React.FC<LaunchDisplayOverlayProps> = ({
  game,
  displays,
  initialSettings,
  onConfirm,
  onCancel,
}) => {
  const [settings, setSettings] = useState<LaunchDisplaySettings>(initialSettings);
  const [section, setSection] = useState<PickerSection>('mode');
  const sizePresetIndex = useMemo(() => {
    const presetIdx = WINDOW_SIZE_PRESETS.findIndex(
      (p) => p.width === settings.windowWidth && p.height === settings.windowHeight
    );
    return presetIdx >= 0 ? presetIdx : 0;
  }, [settings.windowWidth, settings.windowHeight]);

  const [sizePresetOverride, setSizePresetOverride] = useState<number | null>(null);
  const activeSizePresetIndex = sizePresetOverride ?? sizePresetIndex;

  const availableDisplays = displays.length > 0 ? displays : [
    {
      id: 'primary',
      name: 'Primary Display',
      width: 1920,
      height: 1080,
      x: 0,
      y: 0,
      primary: true,
      index: 0,
    },
  ];

  const displayIndex = Math.max(
    0,
    availableDisplays.findIndex((d) => d.id === settings.displayId)
  );

  const sectionOrder = useMemo<PickerSection[]>(() => {
    const order: PickerSection[] = ['mode'];
    if (availableDisplays.length > 1) {
      order.push('display');
    }
    if (settings.mode === 'windowed') {
      order.push('size');
    }
    order.push('remember');
    return order;
  }, [settings.mode, availableDisplays.length]);

  const moveSection = useCallback(
    (delta: number) => {
      const idx = sectionOrder.indexOf(section);
      const next = sectionOrder[(idx + delta + sectionOrder.length) % sectionOrder.length];
      setSection(next);
    },
    [section, sectionOrder]
  );

  const [identifying, setIdentifying] = useState(false);

  const handleIdentify = useCallback(async () => {
    if (identifying) {
      return;
    }
    setIdentifying(true);
    try {
      await identifyConnectedDisplays(settings.displayIndex);
    } finally {
      window.setTimeout(() => setIdentifying(false), 3200);
    }
  }, [identifying, settings.displayIndex]);

  const handleConfirm = useCallback(async () => {
    await saveLaunchDisplaySettings(settings);
    onConfirm(settings);
  }, [onConfirm, settings]);

  useArcadeGamepadListener(true, {
    onUp: () => moveSection(-1),
    onDown: () => moveSection(1),
    onLeft: () => {
      if (section === 'mode') {
        setSettings((s) => ({ ...s, mode: 'fullscreen' }));
      } else if (section === 'display') {
        const idx = (displayIndex - 1 + availableDisplays.length) % availableDisplays.length;
        const next = availableDisplays[idx];
        setSettings((s) => ({
          ...s,
          displayId: next.id,
          displayIndex: next.index,
        }));
      } else if (section === 'size') {
        const idx =
          (activeSizePresetIndex - 1 + WINDOW_SIZE_PRESETS.length) % WINDOW_SIZE_PRESETS.length;
        setSizePresetOverride(idx);
        const preset = WINDOW_SIZE_PRESETS[idx];
        setSettings((s) => ({
          ...s,
          windowWidth: preset.width,
          windowHeight: preset.height,
        }));
      } else if (section === 'remember') {
        setSettings((s) => ({ ...s, rememberChoice: false }));
      }
    },
    onRight: () => {
      if (section === 'mode') {
        setSettings((s) => ({ ...s, mode: 'windowed' }));
      } else if (section === 'display') {
        const idx = (displayIndex + 1) % availableDisplays.length;
        const next = availableDisplays[idx];
        setSettings((s) => ({
          ...s,
          displayId: next.id,
          displayIndex: next.index,
        }));
      } else if (section === 'size') {
        const idx = (activeSizePresetIndex + 1) % WINDOW_SIZE_PRESETS.length;
        setSizePresetOverride(idx);
        const preset = WINDOW_SIZE_PRESETS[idx];
        setSettings((s) => ({
          ...s,
          windowWidth: preset.width,
          windowHeight: preset.height,
        }));
      } else if (section === 'remember') {
        setSettings((s) => ({ ...s, rememberChoice: true }));
      }
    },
    onConfirm: () => void handleConfirm(),
    onBack: onCancel,
    onFavorite: () => void handleIdentify(),
  });

  const activeDisplay = availableDisplays[displayIndex] ?? availableDisplays[0];
  const sizeLabel =
    WINDOW_SIZE_PRESETS[activeSizePresetIndex]?.label ??
    `${settings.windowWidth} × ${settings.windowHeight}`;

  return (
    <div className="launch-display-overlay">
      <div className="launch-display-panel">
        <header className="launch-display-header">
          <Monitor size={22} />
          <div>
            <h2>Launch Display</h2>
            <p>{game.title}</p>
            {availableDisplays.length > 1 && (
              <p className="launch-display-subtitle">Multiple monitors detected — choose where to play.</p>
            )}
          </div>
        </header>

        <div className="launch-display-rows">
          <button
            type="button"
            className={`launch-display-row ${section === 'mode' ? 'is-active' : ''}`}
            onClick={() => setSection('mode')}
          >
            <span className="launch-display-row-label">
              <Maximize2 size={16} /> Mode
            </span>
            <span className="launch-display-row-value">
              {settings.mode === 'fullscreen' ? 'Fullscreen' : 'Windowed'}
            </span>
          </button>

          {availableDisplays.length > 1 && (
            <button
              type="button"
              className={`launch-display-row ${section === 'display' ? 'is-active' : ''}`}
              onClick={() => setSection('display')}
            >
              <span className="launch-display-row-label">
                <Monitor size={16} /> Screen
              </span>
              <span className="launch-display-row-value">
                Display {activeDisplay.index + 1}: {activeDisplay.name} ({activeDisplay.width}×
                {activeDisplay.height})
              </span>
            </button>
          )}

          {settings.mode === 'windowed' && (
            <button
              type="button"
              className={`launch-display-row ${section === 'size' ? 'is-active' : ''}`}
              onClick={() => setSection('size')}
            >
              <span className="launch-display-row-label">
                <RectangleHorizontal size={16} /> Window Size
              </span>
              <span className="launch-display-row-value">{sizeLabel}</span>
            </button>
          )}

          <button
            type="button"
            className={`launch-display-row ${section === 'remember' ? 'is-active' : ''}`}
            onClick={() => setSection('remember')}
          >
            <span className="launch-display-row-label">Remember for all games</span>
            <span className="launch-display-row-value">
              {settings.rememberChoice ? 'Yes' : 'Ask each time'}
            </span>
          </button>
        </div>

        <div className="launch-display-actions">
          <button
            type="button"
            className="launch-display-identify-btn"
            onClick={() => void handleIdentify()}
            disabled={identifying}
          >
            {identifying ? 'Showing numbers…' : 'Identify screens'}
          </button>
        </div>

        <p className="launch-display-hint">
          D-pad up/down to change row · left/right to adjust · A to launch · B to cancel · X to
          identify screens
        </p>

        <ShellGamepadHintRail
          hints={[
            { button: 'A', label: 'Launch' },
            { button: 'B', label: 'Cancel' },
            { button: 'X', label: 'Identify screens' },
          ]}
        />
      </div>
    </div>
  );
};
