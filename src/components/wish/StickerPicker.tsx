import { motion } from 'framer-motion';
import { STICKERS } from '@/lib/constants';
import { cn } from '@/lib/cn';

export interface StickerPickerProps {
  selected: string[];
  onChange: (stickers: string[]) => void;
  onMaxReached?: () => void;
  max?: number;
}

export function StickerPicker({
  selected,
  onChange,
  onMaxReached,
  max = 3,
}: StickerPickerProps) {
  const toggleSticker = (sticker: string) => {
    if (selected.includes(sticker)) {
      onChange(selected.filter((s) => s !== sticker));
    } else {
      if (selected.length < max) {
        onChange([...selected, sticker]);
      } else {
        onMaxReached?.();
      }
    }
  };

  return (
    <div className="grid grid-cols-5 gap-3 place-items-center w-full py-1">
      {STICKERS.map((stk) => {
        const isSelected = selected.includes(stk);
        return (
          <motion.button
            key={stk}
            type="button"
            onClick={() => toggleSticker(stk)}
            whileTap={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22, duration: 0.18 }}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xl transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender',
              isSelected
                ? 'bg-lavender/25 border-lavender scale-105 shadow-glow ring-1 ring-lavender/50'
                : 'bg-bg-soft/70 border-border-soft hover:bg-bg-soft hover:border-border-strong'
            )}
            title={`Dán ${stk}`}
            aria-label={`Dán ${stk}`}
          >
            {stk}
          </motion.button>
        );
      })}
    </div>
  );
}

export default StickerPicker;
