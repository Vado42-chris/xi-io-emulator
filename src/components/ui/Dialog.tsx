import React, { createContext, useCallback, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

const useDialogContext = (): DialogContextValue => {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('Dialog compound components must be used within Dialog');
  }
  return ctx;
};

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => (
  <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
);

export interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  showClose?: boolean;
}

export const DialogContent: React.FC<DialogContentProps> = ({
  className,
  children,
  showClose = true,
}) => {
  const { open, onOpenChange } = useDialogContext();

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleEscape]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="ui-dialog-backdrop"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn('ui-dialog-content-wrap', className)}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {showClose ? (
          <button
            type="button"
            className="ui-dialog-close"
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </button>
        ) : null}
        <div className="ui-dialog-content">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn('ui-dialog-header', className)} {...props} />;

export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => <h2 className={cn('ui-dialog-title', className)} {...props} />;

export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => <p className={cn('ui-dialog-description', className)} {...props} />;
