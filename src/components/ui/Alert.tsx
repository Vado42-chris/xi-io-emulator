import React from 'react';
import { cn } from '../../lib/cn';

export type AlertVariant = 'info' | 'warning' | 'success' | 'destructive';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  children,
  ...props
}) => (
  <div
    role="alert"
    className={cn('ui-alert', `ui-alert--${variant}`, className)}
    {...props}
  >
    {children}
  </div>
);

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => <h4 className={cn('ui-alert__title', className)} {...props} />;

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn('ui-alert__description', className)} {...props} />;

export const AlertContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('ui-alert__content', className)} {...props} />;
