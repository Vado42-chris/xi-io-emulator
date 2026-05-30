import React from 'react';
import { Cpu, CheckCircle, XCircle } from 'lucide-react';
import type { EngineSettings } from '../services/db';
import { isTauriRuntime } from '../services/tauriService';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Input,
  Label,
} from '../components/ui';

const ADAPTER_MANIFEST = `{
  "adapter_id": "retroarch.snes.snes9x",
  "engine_id": "retroarch",
  "system_id": "snes",
  "content_extensions": [".sfc", ".smc"],
  "launch_template": [
    "{engine_path}",
    "-f",
    "-L",
    "{core_path}",
    "{content_path}"
  ]
}`;

export interface EnginesPageProps {
  engineSettings: EngineSettings;
  raPath: string;
  corePath: string;
  fceuxPath: string;
  proofNesPath: string;
  proofSnesPath: string;
  raBrowseOpen: boolean;
  coreBrowseOpen: boolean;
  fceuxBrowseOpen: boolean;
  onRaPathChange: (value: string) => void;
  onCorePathChange: (value: string) => void;
  onFceuxPathChange: (value: string) => void;
  onProofNesPathChange: (value: string) => void;
  onProofSnesPathChange: (value: string) => void;
  onToggleRaBrowse: () => void;
  onToggleCoreBrowse: () => void;
  onToggleFceuxBrowse: () => void;
  onTestEngine: (event: React.FormEvent) => void;
  onRegisterProofGame: (systemId: 'nes' | 'snes', path: string) => void;
}

export const EnginesPage: React.FC<EnginesPageProps> = ({
  engineSettings,
  raPath,
  corePath,
  fceuxPath,
  proofNesPath,
  proofSnesPath,
  raBrowseOpen,
  coreBrowseOpen,
  fceuxBrowseOpen,
  onRaPathChange,
  onCorePathChange,
  onFceuxPathChange,
  onProofNesPathChange,
  onProofSnesPathChange,
  onToggleRaBrowse,
  onToggleCoreBrowse,
  onToggleFceuxBrowse,
  onTestEngine,
  onRegisterProofGame,
}) => {
  const raConfigured =
    Boolean(engineSettings.retroarchBinaryPath) && engineSettings.retroarchBinaryPath !== 'Not set';
  const coreConfigured =
    Boolean(engineSettings.snesCorePath) && engineSettings.snesCorePath !== 'Not set';
  const showEngineWarning =
    !raConfigured || engineSettings.testStatus !== 'success';

  return (
    <div className="content-card">
      <div className="view-header">
        <div className="view-title-container">
          <Cpu className="color-accent" size={24} />
          <h1 className="view-title">Emulator Engines</h1>
        </div>
        <p className="view-subtitle">Manage backend emulator paths and adapter manifests</p>
      </div>

      <div className="engines-stack">
        <div className="engines-checklist">
          <h4 className="engines-checklist__title">
            <Cpu size={16} /> Engine Setup Checklist
          </h4>
          <div className="engines-checklist__items">
            <div className="engines-checklist__item">
              {raConfigured ? (
                <CheckCircle size={14} className="engines-checklist__icon--ok" />
              ) : (
                <XCircle size={14} className="engines-checklist__icon--bad" />
              )}
              <span>RetroArch Path</span>
            </div>
            <div className="engines-checklist__item">
              {coreConfigured ? (
                <CheckCircle size={14} className="engines-checklist__icon--ok" />
              ) : (
                <XCircle size={14} className="engines-checklist__icon--bad" />
              )}
              <span>SNES libretro Core</span>
            </div>
            <div className="engines-checklist__item">
              {engineSettings.testStatus === 'success' ? (
                <CheckCircle size={14} className="engines-checklist__icon--ok" />
              ) : (
                <XCircle size={14} className="engines-checklist__icon--warn" />
              )}
              <span>Diagnostic Test</span>
            </div>
          </div>
        </div>

        {showEngineWarning ? (
          <Alert variant="warning">
            <AlertContent>
              <AlertTitle>Missing or Untested Backend Program</AlertTitle>
              <AlertDescription>
                A local RetroArch installation was not found or has not been tested. In order to
                launch games later, configure the binary path below.
              </AlertDescription>
            </AlertContent>
          </Alert>
        ) : null}

        <form className="engines-form" onSubmit={onTestEngine}>
          <div className="engines-settings-list">
            <div className="engines-settings-row">
              <div className="engines-settings-meta">
                <Label htmlFor="engine-ra-path">RetroArch Binary Path</Label>
                <p className="ui-field__description">
                  Location of the RetroArch executable on your system
                </p>
              </div>
              <div className="engines-path-row">
                <Input
                  id="engine-ra-path"
                  fixedWidth
                  value={raPath}
                  onChange={(e) => onRaPathChange(e.target.value)}
                  aria-label="RetroArch binary path"
                />
                <Button type="button" variant="secondary" size="sm" onClick={onToggleRaBrowse}>
                  Browse...
                </Button>
                {raBrowseOpen ? (
                  <div className="ui-browse-popover">
                    <p className="ui-browse-popover__heading">Linux RetroArch Presets</p>
                    <button
                      type="button"
                      className="ui-browse-popover__option"
                      onClick={() => {
                        onRaPathChange('/usr/bin/retroarch');
                        onToggleRaBrowse();
                      }}
                    >
                      /usr/bin/retroarch (Ubuntu/Arch Native)
                    </button>
                    <button
                      type="button"
                      className="ui-browse-popover__option"
                      onClick={() => {
                        onRaPathChange('/var/lib/flatpak/exports/bin/org.libretro.RetroArch');
                        onToggleRaBrowse();
                      }}
                    >
                      org.libretro.RetroArch (Flatpak)
                    </button>
                    <button
                      type="button"
                      className="ui-browse-popover__option ui-browse-popover__option--reset"
                      onClick={() => {
                        onRaPathChange('Not set');
                        onToggleRaBrowse();
                      }}
                    >
                      Reset to Empty
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="engines-settings-row">
              <div className="engines-settings-meta">
                <Label htmlFor="engine-core-path">SNES Core Path (Snes9x)</Label>
                <p className="ui-field__description">
                  Path to the Snes9x libretro library file (.so)
                </p>
              </div>
              <div className="engines-path-row">
                <Input
                  id="engine-core-path"
                  fixedWidth
                  value={corePath}
                  onChange={(e) => onCorePathChange(e.target.value)}
                  aria-label="SNES core path"
                />
                <Button type="button" variant="secondary" size="sm" onClick={onToggleCoreBrowse}>
                  Browse...
                </Button>
                {coreBrowseOpen ? (
                  <div className="ui-browse-popover">
                    <p className="ui-browse-popover__heading">Linux Snes9x Core Presets</p>
                    <button
                      type="button"
                      className="ui-browse-popover__option"
                      onClick={() => {
                        onCorePathChange('/usr/lib/x86_64-linux-gnu/libretro/snes9x_libretro.so');
                        onToggleCoreBrowse();
                      }}
                    >
                      /usr/lib/.../snes9x_libretro.so (Ubuntu Native)
                    </button>
                    <button
                      type="button"
                      className="ui-browse-popover__option"
                      onClick={() => {
                        onCorePathChange(
                          '/home/user/.var/app/org.libretro.RetroArch/config/retroarch/cores/snes9x_libretro.so'
                        );
                        onToggleCoreBrowse();
                      }}
                    >
                      Flatpak config cores directory
                    </button>
                    <button
                      type="button"
                      className="ui-browse-popover__option"
                      onClick={() => {
                        onCorePathChange('/usr/lib/libretro/snes9x_libretro.so');
                        onToggleCoreBrowse();
                      }}
                    >
                      /usr/lib/libretro/snes9x_libretro.so (Arch Linux Native)
                    </button>
                    <button
                      type="button"
                      className="ui-browse-popover__option ui-browse-popover__option--reset"
                      onClick={() => {
                        onCorePathChange('Not set');
                        onToggleCoreBrowse();
                      }}
                    >
                      Reset to Empty
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="engines-settings-row">
              <div className="engines-settings-meta">
                <Label htmlFor="engine-fceux-path">FCEUX Binary Path (NES proof)</Label>
                <p className="ui-field__description">
                  Location of the FCEUX executable for NES launch proof
                </p>
              </div>
              <div className="engines-path-row">
                <Input
                  id="engine-fceux-path"
                  fixedWidth
                  value={fceuxPath}
                  onChange={(e) => onFceuxPathChange(e.target.value)}
                  aria-label="FCEUX binary path"
                />
                <Button type="button" variant="secondary" size="sm" onClick={onToggleFceuxBrowse}>
                  Browse...
                </Button>
                {fceuxBrowseOpen ? (
                  <div className="ui-browse-popover">
                    <button
                      type="button"
                      className="ui-browse-popover__option"
                      onClick={() => {
                        onFceuxPathChange('/usr/bin/fceux');
                        onToggleFceuxBrowse();
                      }}
                    >
                      /usr/bin/fceux
                    </button>
                    <button
                      type="button"
                      className="ui-browse-popover__option"
                      onClick={() => {
                        onFceuxPathChange('/usr/games/fceux');
                        onToggleFceuxBrowse();
                      }}
                    >
                      /usr/games/fceux
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="engines-form-actions">
            <Button type="submit" variant="primary" size="md">
              Save &amp; Test Setup
            </Button>
          </div>
        </form>

        {engineSettings.testStatus === 'success' ? (
          <Alert variant="success">
            <CheckCircle size={18} className="engines-checklist__icon--ok" aria-hidden />
            <AlertContent>
              <AlertTitle>Diagnostic Pass: Ready</AlertTitle>
              <AlertDescription>
                Detected {engineSettings.detectedVersion} ({engineSettings.launchStrategy}{' '}
                execution mode). Last tested at {engineSettings.lastTestedAt}.
              </AlertDescription>
            </AlertContent>
          </Alert>
        ) : null}

        <div className="status-card engines-proof-panel">
          <h4 className="engines-proof-panel__title">
            #xar:controller-launch-proof/current — Proof Games Only
          </h4>
          <p className="engines-proof-panel__desc">
            Register one NES and one SNES ROM path for launch proof. Do not bulk-scan libraries in
            this milestone.
          </p>
          <div className="engines-proof-grid">
            <Input
              placeholder="Path to one .nes ROM for FCEUX proof"
              value={proofNesPath}
              onChange={(e) => onProofNesPathChange(e.target.value)}
              aria-label="NES proof ROM path"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void onRegisterProofGame('nes', proofNesPath)}
            >
              Register NES Proof
            </Button>
          </div>
          <div className="engines-proof-grid">
            <Input
              placeholder="Path to one .sfc/.smc ROM for RetroArch proof"
              value={proofSnesPath}
              onChange={(e) => onProofSnesPathChange(e.target.value)}
              aria-label="SNES proof ROM path"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void onRegisterProofGame('snes', proofSnesPath)}
            >
              Register SNES Proof
            </Button>
          </div>
          {!isTauriRuntime() ? (
            <p className="engines-tauri-hint">Real launch requires Tauri: npm run tauri:dev</p>
          ) : null}
          <Badge variant="muted">Pass B — partial / blocked until launch proof completes</Badge>
        </div>

        <details className="engines-manifest">
          <summary className="engines-manifest__summary">
            View Adapter Manifest Details (retroarch.snes.snes9x)
          </summary>
          <pre className="engines-manifest__pre">{ADAPTER_MANIFEST}</pre>
        </details>
      </div>
    </div>
  );
};
