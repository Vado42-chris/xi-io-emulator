import React from 'react';

interface TagPillProps {
  tag: string;
}

export const TagPill: React.FC<TagPillProps> = ({ tag }) => {
  const getTagClass = () => {
    if (tag.startsWith('system:')) {
      return 'system';
    } else if (tag.includes('single')) {
      return 'source-single';
    } else if (tag.includes('batch')) {
      return 'source-batch';
    } else if (tag.includes('raw') || tag.includes('identity')) {
      return 'identity-raw';
    }
    return '';
  };

  // Humanize tag for display, e.g. "system:snes" -> "system: snes" or just "snes"
  // Let's keep it as is but format slightly to look extremely clean, e.g. replacing colons with a space or keeping the full text.
  // Full text is fine because the stylesheet was designed with raw tags in mind (e.g. system:snes, source:single_game).
  const tagClass = getTagClass();

  return (
    <span className={`game-tag-badge ${tagClass}`}>
      {tag}
    </span>
  );
};
