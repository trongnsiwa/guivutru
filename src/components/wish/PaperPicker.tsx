import { PaperTheme } from '@/types/note';
import { PAPER_THEMES } from '@/lib/constants';
import { cn } from '@/lib/cn';

export interface PaperPickerProps {
  selected: PaperTheme;
  onChange: (theme: PaperTheme) => void;
}

const themeTokenStyles: Record<PaperTheme, string> = {
  'dem-sao': 'bg-paper-dem-sao border-border-paper-dem-sao',
  'tim-mong': 'bg-paper-tim-mong border-border-paper-tim-mong',
  hogn: 'bg-paper-hogn border-border-paper-hogn',
  bien: 'bg-paper-bien border-border-paper-bien',
  rung: 'bg-paper-rung border-border-paper-rung',
  'giay-cu': 'bg-paper-giay-cu border-border-paper-giay-cu',
};

export function PaperPicker({ selected, onChange }: PaperPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {PAPER_THEMES.map((theme) => {
        const isSelected = selected === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={cn(
              'h-8 w-8 rounded-full border-2 transition-transform cursor-pointer',
              themeTokenStyles[theme.id],
              isSelected
                ? 'scale-115 ring-2 ring-lavender/60 shadow-glow'
                : 'opacity-80 hover:opacity-100'
            )}
            title={theme.name}
            aria-label={theme.name}
          />
        );
      })}
    </div>
  );
}
