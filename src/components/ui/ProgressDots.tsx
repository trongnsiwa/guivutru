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

        return (
          <React.Fragment key={stepNum}>
            <button
              type="button"
              onClick={() => onStepClick?.(stepNum)}
              disabled={!onStepClick}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                isActive
                  ? 'bg-lavender text-bg-deep ring-2 ring-lavender/50 shadow-glow'
                  : isDone
                  ? 'bg-mint text-bg-deep'
                  : 'bg-bg-soft text-text-muted border border-border-soft'
              )}
            >
              {stepNum}
            </button>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  'h-0.5 w-6 transition-colors',
                  isDone ? 'bg-mint/80' : 'bg-border-soft'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
