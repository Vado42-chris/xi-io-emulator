import React from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  fixedWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, fixedWidth, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'ui-input',
        error && 'ui-input--error',
        fixedWidth && 'ui-input--fixed-width',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';
