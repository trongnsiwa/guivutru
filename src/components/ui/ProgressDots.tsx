import React from 'react';
import { cn } from '@/lib/cn';

export interface ProgressDotsProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

export function ProgressDots({
  currentStep,
  totalSteps = 3,
  onStepClick,
}: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        const isClickable = isDone && Boolean(onStepClick);

        return (
          <React.Fragment key={stepNum}>
            <button
              type="button"
              onClick={() => isClickable && onStepClick?.(stepNum)}
              disabled={!isClickable}
              className={cn(
                'flex items-center justify-center rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
                isActive
                  ? 'h-8 w-8 scale-110 bg-lavender text-bg-deep ring-2 ring-lavender/60 shadow-glow font-bold'
                  : isDone
                  ? 'h-7 w-7 bg-bg-soft text-lavender border border-lavender/50 hover:bg-lavender/20 cursor-pointer'
                  : 'h-7 w-7 bg-bg-soft text-text-muted border border-border-soft/60 opacity-40 cursor-not-allowed'
              )}
              aria-label={`Bước ${stepNum}`}
            >
              {stepNum}
            </button>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  'h-0.5 w-6 transition-colors',
                  isDone ? 'bg-lavender/50' : 'bg-border-soft/40'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
