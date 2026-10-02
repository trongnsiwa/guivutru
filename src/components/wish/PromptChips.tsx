import { PROMPT_OPTIONS, PromptOption } from '@/lib/constants';
import { Chip } from '@/components/ui/Chip';

export interface PromptChipsProps {
  selectedId: string | null;
  onSelect: (option: PromptOption) => void;
}

export function PromptChips({ selectedId, onSelect }: PromptChipsProps) {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {PROMPT_OPTIONS.map((option) => (
        <Chip
          key={option.id}
          active={selectedId === option.id}
          onClick={() => onSelect(option)}
          className="w-full text-base py-3"
        >
          {option.text}
        </Chip>
      ))}
    </div>
  );
}
