import { Textarea } from '@/components/ui/Textarea';
import { PaperPicker } from '@/components/wish/PaperPicker';
import { StickerPicker } from '@/components/wish/StickerPicker';
import { PaperTheme } from '@/types/note';

export interface Step2ContentProps {
  content: string;
  onContentChange: (val: string) => void;
  theme: PaperTheme;
  onThemeChange: (theme: PaperTheme) => void;
  stickers: string[];
  onStickersChange: (stickers: string[]) => void;
}

export function Step2Content({
  content,
  onContentChange,
  theme,
  onThemeChange,
  stickers,
  onStickersChange,
}: Step2ContentProps) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-display text-2xl font-normal text-text-primary">
          Viết điều ước của bạn ✍️
        </h2>
        <p className="font-sans text-xs text-text-secondary">
          Nắn nót từng từ một, gửi trọn niềm tin nhé.
        </p>
      </div>

      <Textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        currentLength={content.length}
        maxLength={500}
        rows={6}
        placeholder="Mình muốn đến Đà Lạt và ở đó mãi mãi…"
      />

      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary">Chọn giấy:</label>
        <PaperPicker selected={theme} onChange={onThemeChange} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary">
          Dán sticker (tối đa 3):
        </label>
        <StickerPicker selected={stickers} onChange={onStickersChange} />
      </div>
    </div>
  );
}
