import { STICKERS } from '@/lib/constants';
import { cn } from '@/lib/cn';

export interface StickerPickerProps {
  selected: string[];
  onChange: (stickers: string[]) => void;
  max?: number;
}

export function StickerPicker({
  selected,
  onChange,
  max = 3,
}: StickerPickerProps) {
  const toggleSticker = (sticker: string) => {
    if (selected.includes(sticker)) {
      onChange(selected.filter((s) => s !== sticker));
    } else {
      if (selected.length < max) {
        onChange([...selected, sticker]);
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STICKERS.map((stk) => {
        const isSelected = selected.includes(stk);
        return (
          <button
            key={stk}
            type="button"
            onClick={() => toggleSticker(stk)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-transform',
              isSelected
                ? 'bg-lavender/20 border-lavender scale-110 shadow-glow'
                : 'bg-bg-soft/60 border-border-soft hover:bg-bg-soft hover:border-border-strong'
            )}
          >
            {stk}
          </button>
        );
      })}
    </div>
  );
}
