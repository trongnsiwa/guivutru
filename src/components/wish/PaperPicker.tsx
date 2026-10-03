import { PaperTheme } from '@/types/note';
import { PAPER_THEMES } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ScrollRow } from '@/components/ui/ScrollRow';

export interface PaperPickerProps {
  selected: PaperTheme;
  onChange: (theme: PaperTheme) => void;
}

export function PaperPicker({ selected, onChange }: PaperPickerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ScrollRow>
      {PAPER_THEMES.map((theme) => {
        const isSelected = selected === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            style={{
              backgroundColor: theme.bgColor,
              borderColor: theme.borderColor,
            }}
            className={cn(
              'h-9 w-9 shrink-0 snap-start rounded-full border-2 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep focus-visible:ring-lavender',
              isSelected
                ? cn(
                    'ring-2 ring-lavender shadow-glow',
                    !prefersReducedMotion && 'scale-105'
                  )
                : 'opacity-70 hover:opacity-100 hover:scale-102'
            )}
            title={theme.name}
            aria-label={theme.name}
          />
        );
      })}
    </ScrollRow>
  );
}

export default PaperPicker;
