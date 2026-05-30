import React from 'react';
import { cn } from '../../lib/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('ui-label', required && 'ui-label--required', className)}
      {...props}
    >
      {children}
    </label>
  )
);

Label.displayName = 'Label';
