import React from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-md border border-border-soft p-5 transition-shadow',
        elevated ? 'bg-bg-elevated shadow-dark' : 'bg-bg-soft/90 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
