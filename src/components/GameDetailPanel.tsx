import React, { useState } from 'react';
import { 
  X, Eye, EyeOff, Image as ImageIcon, BookOpen, 
  Code, ShieldAlert, Cpu, Heart, Database, AlertCircle
} from 'lucide-react';
import type { GameRecord } from '../data/gameModels';
import type { LibraryRoot } from '../services/db';
import { ReadinessBadge } from './ReadinessBadge';
import { TagPill } from './TagPill';

interface GameDetailPanelProps {
  game: GameRecord;
  libraryRoot?: LibraryRoot;
  onClose: () => void;
  onToggleFavorite: (game: GameRecord) => void;
  onToggleHidden: (game: GameRecord) => void;
}

type TabType = 'artwork' | 'guides' | 'cheats' | 'patches' | 'hacks' | 'controller';

export const GameDetailPanel: React.FC<GameDetailPanelProps> = ({
  game,
  libraryRoot,
  onClose,
  onToggleFavorite,
  onToggleHidden
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('artwork');

  // Compute status
  const isRootMounted = libraryRoot ? libraryRoot.mounted : true;
  const currentStatus = (game.ingressMode === 'batch_library' && !isRootMounted) 
    ? 'blocked' 
    : game.launchStatus;

  const blockers = [];
  if (game.ingressMode === 'batch_library' && !isRootMounted) {
    blockers.push(`Drive Offline: Mount root path "${libraryRoot?.path}" to launch.`);
  }
  // RetroArch is currently always not configured in the mockup
  blockers.push("RetroArch binary path not set. Define path in engines tab.");

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'artwork':
        return (
          <div className="tab-pane-content">
            <h4 className="tab-section-header">Game Artwork</h4>
            <p className="tab-section-desc">Add visual assets to display in the main arcade shell. (Scraper pending integration)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div className="artwork-mock-box">
                <ImageIcon size={24} style={{ color: 'var(--color-accent)' }} />
                <span>Box Art (Front)</span>
                <span className="artwork-mock-status">No Asset Found</span>
              </div>
              <div className="artwork-mock-box">
                <ImageIcon size={24} style={{ color: 'var(--color-accent)' }} />
                <span>Gameplay Screenshot</span>
                <span className="artwork-mock-status">No Asset Found</span>
              </div>
            </div>
            <button className="btn-secondary" style={{ marginTop: '16px', width: '100%', fontSize: '0.8rem', padding: '8px' }}>
              Upload Custom Image File
            </button>
          </div>
        );
      case 'guides':
        return (
          <div className="tab-pane-content">
            <h4 className="tab-section-header">Gameplay Guides & Wikis</h4>
            <p className="tab-section-desc">Quick references, game manuals, and walk-through guides for this game.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <div className="guide-mock-item">
                <BookOpen size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Default Game Manual</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Offline text document helper</div>
                </div>
                <span className="badge not-configured" style={{ fontSize: '0.6rem' }}>Missing</span>
              </div>
              <div className="guide-mock-item">
                <BookOpen size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>IGN Walkthrough & Tips</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>https://ign.com/games/{game.sortTitle}</div>
                </div>
                <span className="badge ready" style={{ fontSize: '0.6rem' }}>Link Available</span>
              </div>
            </div>
            <button className="btn-secondary" style={{ marginTop: '16px', width: '100%', fontSize: '0.8rem', padding: '8px' }}>
              Add Web Manual / Wiki URL
            </button>
          </div>
        );
      case 'cheats':
        return (
          <div className="tab-pane-content">
            <h4 className="tab-section-header">Cheats & Hacks Database</h4>
            <p className="tab-section-desc">Enable Game Genie or Pro Action Replay codes directly in the virtual console.</p>
            <div style={{ marginTop: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '6px 0' }}>Code Name</th>
                    <th>Code Value</th>
                    <th style={{ textAlign: 'right' }}>Active</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Infinite Lives</td>
                    <td style={{ fontFamily: 'monospace' }}>C221-0D04</td>
                    <td style={{ textAlign: 'right' }}><input type="checkbox" checked disabled /></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>Invincibility</td>
                    <td style={{ fontFamily: 'monospace' }}>C2C1-6DAD</td>
                    <td style={{ textAlign: 'right' }}><input type="checkbox" checked={false} disabled /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button className="btn-secondary" style={{ marginTop: '16px', width: '100%', fontSize: '0.8rem', padding: '8px' }}>
              Create Custom Cheat Code
            </button>
          </div>
        );
      case 'patches':
        return (
          <div className="tab-pane-content">
            <h4 className="tab-section-header">ROM Soft-Patches (.ips / .bps)</h4>
            <p className="tab-section-desc">Load translation or correction patches dynamically at runtime without editing the original file.</p>
            <div className="patch-mock-dropzone">
              <Code size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Drag & Drop Patch Files Here</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Supports .ips, .bps, .ups formats</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px', display: 'flex', gap: '4px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, color: 'var(--color-accent)' }} />
              <span>Patches will be stored in <code>saves/patches/{game.systemId}</code></span>
            </div>
          </div>
        );
      case 'hacks':
        return (
          <div className="tab-pane-content">
            <h4 className="tab-section-header">Hacks & Visual Variants</h4>
            <p className="tab-section-desc">Manage game overrides, fan-made translations, or modified level packs.</p>
            <div className="status-card" style={{ padding: '12px', fontSize: '0.8rem', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Base Ingress ROM</span>
                <span style={{ color: 'var(--color-success)' }}>active</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Uses default file system properties for launching.
              </div>
            </div>
            <button className="btn-secondary" style={{ marginTop: '16px', width: '100%', fontSize: '0.8rem', padding: '8px' }}>
              Add Alternative ROM Variant
            </button>
          </div>
        );
      case 'controller':
        return (
          <div className="tab-pane-content">
            <h4 className="tab-section-header">Virtual Controller Mapping</h4>
            <p className="tab-section-desc">Visual mapping profile for the SNES system. Controller configuration will be saved per-profile.</p>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Active profile:</span>
                <span style={{ fontWeight: 600 }}>Keyboard Mapping MVP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                <span>SNES D-Pad / Buttons</span>
                <span>Keyboard Key</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Up</span><span style={{ color: 'var(--color-accent)' }}>UpArrow</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Button A</span><span style={{ color: 'var(--color-accent)' }}>X</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Down</span><span style={{ color: 'var(--color-accent)' }}>DownArrow</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Button B</span><span style={{ color: 'var(--color-accent)' }}>Z</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Left</span><span style={{ color: 'var(--color-accent)' }}>LeftArrow</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Button X</span><span style={{ color: 'var(--color-accent)' }}>S</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Right</span><span style={{ color: 'var(--color-accent)' }}>RightArrow</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Button Y</span><span style={{ color: 'var(--color-accent)' }}>A</span></div>
              </div>
            </div>
            <button className="btn-secondary" style={{ marginTop: '16px', width: '100%', fontSize: '0.8rem', padding: '8px' }} disabled>
              Launch Input Remapper UI (M1 Required)
            </button>
          </div>
        );
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cpu className="color-accent" size={20} />
            <h2 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Game Metadata & Inspection</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Left Column: Core properties */}
          <div className="modal-col-left">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{game.title}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: {game.id}</span>
              </div>
              <ReadinessBadge status={currentStatus} blockers={currentStatus === 'blocked' ? ['Drive Offline'] : []} />
            </div>

            {/* Ingress status info */}
            <div className="detail-meta-list" style={{ marginTop: '16px' }}>
              <div className="detail-meta-item">
                <span className="detail-meta-label">Original Filename:</span>
                <span className="detail-meta-value" style={{ wordBreak: 'break-all' }}>{game.originalFileName}</span>
              </div>
              <div className="detail-meta-item">
                <span className="detail-meta-label">Content Path:</span>
                <span className="detail-meta-value" style={{ wordBreak: 'break-all', fontSize: '0.75rem', fontFamily: 'monospace' }}>{game.contentPath}</span>
              </div>
              <div className="detail-meta-item">
                <span className="detail-meta-label">Console System:</span>
                <span className="detail-meta-value" style={{ textTransform: 'uppercase', fontWeight: 600 }}>{game.systemId}</span>
              </div>
              <div className="detail-meta-item">
                <span className="detail-meta-label">Ingress Mode:</span>
                <span className="detail-meta-value" style={{ textTransform: 'capitalize' }}>
                  {game.ingressMode === 'single_game' ? 'Single game' : 'Batch library'}
                </span>
              </div>
              <div className="detail-meta-item">
                <span className="detail-meta-label">Identity Status:</span>
                <span className="detail-meta-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className={`badge ${game.identityStatus === 'normalized' ? 'ready' : 'not-configured'}`} style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                    {game.identityStatus}
                  </span>
                </span>
              </div>
              <div className="detail-meta-item">
                <span className="detail-meta-label">File Size:</span>
                <span className="detail-meta-value">{formatBytes(game.fileSizeBytes)}</span>
              </div>
              {game.tags && game.tags.length > 0 && (
                <div className="detail-meta-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span className="detail-meta-label" style={{ marginBottom: '2px' }}>Tags:</span>
                  <span className="detail-meta-value" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {game.tags.map(tag => (
                      <TagPill key={tag} tag={tag} />
                    ))}
                  </span>
                </div>
              )}
              {game.checksum && (
                <div className="detail-meta-item">
                  <span className="detail-meta-label">SHA-256 Checksum:</span>
                  <span className="detail-meta-value" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{game.checksum}</span>
                </div>
              )}
            </div>

            {/* Storage Root Details */}
            {libraryRoot && (
              <div className="detail-storage-box" style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  <Database size={14} className="color-accent" />
                  <span>Linked Library Root</span>
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>Label:</strong> {libraryRoot.label}</div>
                  <div><strong>Path:</strong> {libraryRoot.path}</div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span style={{ color: libraryRoot.mounted ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
                      {libraryRoot.mounted ? 'Mounted' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Launch Blockers */}
            <div className="detail-blockers-box" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.85rem', color: blockers.length > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                <ShieldAlert size={14} />
                <span>Launch Blockers ({blockers.length})</span>
              </div>
              {blockers.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>No active launch blockers. Ready for engine test.</p>
              ) : (
                <ul style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {blockers.map((block, idx) => (
                    <li key={idx} style={{ color: block.includes('Offline') ? 'var(--color-warning)' : '' }}>{block}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick Actions (Favorite & Hidden) */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                className={`btn-secondary ${game.favorite ? 'active' : ''}`} 
                onClick={() => onToggleFavorite(game)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderColor: game.favorite ? '#fbbf24' : '' }}
              >
                <Heart size={16} fill={game.favorite ? '#fbbf24' : 'none'} style={{ color: game.favorite ? '#fbbf24' : '' }} />
                <span>{game.favorite ? 'Favorited' : 'Favorite'}</span>
              </button>
              
              <button 
                className={`btn-secondary ${game.hidden ? 'active' : ''}`} 
                onClick={() => onToggleHidden(game)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderColor: game.hidden ? 'var(--color-warning)' : '' }}
              >
                {game.hidden ? <Eye size={16} style={{ color: 'var(--color-warning)' }} /> : <EyeOff size={16} />}
                <span>{game.hidden ? 'Hidden' : 'Hide'}</span>
              </button>
            </div>

            {/* Launch Game Disabled Placeholder */}
            <button className="btn-primary" style={{ width: '100%', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }} disabled>
              <Cpu size={16} />
              Launch Game (Process execution deferred)
            </button>
          </div>

          {/* Right Column: Tabbed Placeholders */}
          <div className="modal-col-right">
            {/* Tabs Navigation */}
            <div className="detail-tabs">
              <button className={`detail-tab-btn ${activeTab === 'artwork' ? 'active' : ''}`} onClick={() => setActiveTab('artwork')}>Artwork</button>
              <button className={`detail-tab-btn ${activeTab === 'guides' ? 'active' : ''}`} onClick={() => setActiveTab('guides')}>Guides</button>
              <button className={`detail-tab-btn ${activeTab === 'cheats' ? 'active' : ''}`} onClick={() => setActiveTab('cheats')}>Cheats</button>
              <button className={`detail-tab-btn ${activeTab === 'patches' ? 'active' : ''}`} onClick={() => setActiveTab('patches')}>Patches</button>
              <button className={`detail-tab-btn ${activeTab === 'hacks' ? 'active' : ''}`} onClick={() => setActiveTab('hacks')}>Hacks</button>
              <button className={`detail-tab-btn ${activeTab === 'controller' ? 'active' : ''}`} onClick={() => setActiveTab('controller')}>Controller</button>
            </div>

            {/* Tab Pane */}
            <div className="detail-tab-pane">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
