import React from 'react';
import { cn } from '../../lib/cn';
import { Label } from './Label';

export interface FieldProps {
  id?: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  id,
  label,
  description,
  error,
  required,
  className,
  children,
}) => (
  <div className={cn('ui-field', className)}>
    {label ? (
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
    ) : null}
    {description ? <p className="ui-field__description">{description}</p> : null}
    {children}
    {error ? <p className="ui-field__error">{error}</p> : null}
  </div>
);
