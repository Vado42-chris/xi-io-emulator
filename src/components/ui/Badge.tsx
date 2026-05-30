import React from 'react';
import { cn } from '../../lib/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'muted';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  ...props
}) => (
  <span className={cn('ui-badge', `ui-badge--${variant}`, className)} {...props} />
);
