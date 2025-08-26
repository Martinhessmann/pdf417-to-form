// Purpose: Alert component for displaying messages and notifications

import { cn } from '@/lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
}

export function Alert({ className, variant = 'default', children, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4',
        {
          'border-border text-foreground': variant === 'default',
          'border-destructive/50 text-destructive dark:border-destructive': variant === 'destructive',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function AlertDescription({ className, children, ...props }: AlertDescriptionProps) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    >
      {children}
    </div>
  );
}
