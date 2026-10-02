import { PROMPTS, PromptOption } from '@/lib/constants';
import { Chip } from '@/components/ui/Chip';

export interface PromptChipsProps {
  selectedId: string | null;
  onSelect: (option: PromptOption) => void;
}

export function PromptChips({ selectedId, onSelect }: PromptChipsProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {PROMPTS.map((option) => (
        <Chip
          key={option.id}
          active={selectedId === option.id}
          onClick={() => onSelect(option)}
          className="w-full text-[15px] sm:text-base py-3.5 px-5 font-sans font-medium"
        >
          {option.text}
        </Chip>
      ))}
    </div>
  );
}
