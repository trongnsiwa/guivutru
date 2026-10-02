import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  currentLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, maxLength = 500, currentLength, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          maxLength={maxLength}
          className={cn(
            'w-full resize-none rounded-lg border border-border-soft bg-transparent p-4 font-note text-[22px] leading-[1.5] text-text-primary placeholder:text-text-muted focus:border-lavender focus:outline-none focus:ring-1 focus:ring-lavender/50',
            className
          )}
          {...props}
        />
        {typeof currentLength === 'number' && (
          <div className="text-right font-sans text-xs text-text-muted mt-1">
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
