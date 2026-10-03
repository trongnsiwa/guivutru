import React from 'react';
import { cn } from '@/lib/cn';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const Chip = React.memo(function Chip({
  active = false,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'px-4 py-2.5 rounded-pill text-sm font-sans border transition-all duration-150 cursor-pointer text-left',
        'hover:scale-[1.02] active:scale-[1.05] motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
        active
          ? 'bg-lavender/15 border-lavender text-text-primary shadow-glow ring-1 ring-lavender/40'
          : 'bg-bg-soft/70 border-border-soft text-text-secondary hover:text-text-primary hover:border-border-strong',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default Chip;
