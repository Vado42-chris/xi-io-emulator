import React from 'react';

interface ShellGamepadHint {
  button: string;
  label: string;
  tone?: 'confirm' | 'back' | 'menu' | 'neutral';
}

interface ShellGamepadHintRailProps {
  hints: ShellGamepadHint[];
}

const toneClass = (tone: ShellGamepadHint['tone']): string => {
  switch (tone) {
    case 'confirm':
      return 'action-a';
    case 'back':
      return 'action-x';
    case 'menu':
      return 'action-menu';
    default:
      return 'action-x';
  }
};

export const ShellGamepadHintRail: React.FC<ShellGamepadHintRailProps> = ({ hints }) => (
  <div className="arcade-hint-rail" style={{ marginTop: '20px', justifyContent: 'center' }}>
    {hints.map((hint) => (
      <div key={`${hint.button}-${hint.label}`} className="arcade-hint-item">
        <span
          className={`arcade-hint-button ${toneClass(hint.tone)}`}
          style={hint.tone === 'back' ? { backgroundColor: '#3b82f6' } : undefined}
        >
          {hint.button}
        </span>
        <span>{hint.label}</span>
      </div>
    ))}
  </div>
);
