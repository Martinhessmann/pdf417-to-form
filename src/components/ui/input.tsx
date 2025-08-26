// Purpose: Enhanced input component with better styling and accessibility

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled';
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = 'default', error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200 placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Variant styles
          {
            'border-input hover:border-border/60': variant === 'default' && !error,
            'border-destructive focus:border-destructive focus:ring-destructive/20': error,
            'bg-muted/50 border-muted': variant === 'filled',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
