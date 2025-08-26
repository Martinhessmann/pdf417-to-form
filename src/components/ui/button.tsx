// Purpose: Reusable button component with variants and sizes

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        // Variant styles
        {
          'bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md': variant === 'default',
          'bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 hover:shadow-md': variant === 'destructive',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-border/60': variant === 'outline',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'hover:bg-accent hover:text-accent-foreground rounded-md': variant === 'ghost',
          'text-primary underline-offset-4 hover:underline p-0 h-auto': variant === 'link',
        },
        // Size styles
        {
          'h-10 px-4 py-2 text-sm': size === 'default',
          'h-9 px-3 text-sm': size === 'sm',
          'h-12 px-8 text-base font-semibold': size === 'lg',
          'h-10 w-10 p-0': size === 'icon',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
