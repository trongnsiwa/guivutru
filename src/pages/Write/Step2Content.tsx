import { useEffect, useRef } from 'react';
import { NotePaper } from '@/components/wish/NotePaper';
import { PaperPicker } from '@/components/wish/PaperPicker';
import { StickerPicker } from '@/components/wish/StickerPicker';
import { VoiceRecorder } from '@/components/wish/VoiceRecorder';
import { PaperTheme } from '@/types/note';
import { MAX_CONTENT_LENGTH } from '@/lib/constants';
import { cn } from '@/lib/cn';

export interface Step2ContentProps {
  content: string;
  onContentChange: (val: string) => void;
  paperTheme: PaperTheme;
  onPaperThemeChange: (theme: PaperTheme) => void;
  stickerIds: string[];
  onStickerIdsChange: (stickers: string[]) => void;
  onStickerMaxReached: () => void;
  hasAudio?: boolean;
  audioBlob?: Blob | null;
  audioDuration?: number;
  onAudioChange?: (blob: Blob, duration: number) => void;
  onAudioDelete?: () => void;
}

export function Step2Content({
  content,
  onContentChange,
  paperTheme,
  onPaperThemeChange,
  stickerIds,
  onStickerIdsChange,
  onStickerMaxReached,
  hasAudio = false,
  audioBlob = null,
  audioDuration = 0,
  onAudioChange,
  onAudioDelete,
}: Step2ContentProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const blankIndex = content.indexOf('___');
      if (blankIndex !== -1) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(blankIndex, blankIndex + 3);
      } else {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(content.length, content.length);
      }
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center min-w-0">
      <h1 className="font-display font-normal text-[32px] text-text-primary text-center leading-[1.3] mb-6">
        Viết điều ước của bạn
      </h1>

      <div className="w-full max-w-[420px] space-y-4 min-w-0">
        {/* NotePaper in edit mode */}
        <div className="relative">
          <NotePaper
            mode="edit"
            paperTheme={paperTheme}
            content={content}
            onContentChange={onContentChange}
            stickerIds={stickerIds}
            textareaRef={textareaRef}
            placeholder="Vũ trụ đang chờ nghe bạn nói…"
            maxLength={MAX_CONTENT_LENGTH}
          />
        </div>

        {/* Character counter & Voice recorder row */}
        <div className="flex justify-end px-1 -mt-2">
          <span
            className={cn(
              'font-sans text-[13px] transition-colors',
              content.length >= MAX_CONTENT_LENGTH
                ? 'text-pink font-semibold'
                : content.length > 450
                ? 'text-peach font-semibold'
                : 'text-text-muted'
            )}
          >
            {content.length}/{MAX_CONTENT_LENGTH}
          </span>
        </div>

        {/* Voice Recorder */}
        {onAudioChange && onAudioDelete && (
          <VoiceRecorder
            hasAudio={hasAudio}
            audioBlob={audioBlob}
            audioDuration={audioDuration}
            onAudioChange={onAudioChange}
            onAudioDelete={onAudioDelete}
          />
        )}

        {/* Paper Picker */}
        <div className="space-y-2 pt-1 min-w-0">
          <label className="block text-xs font-semibold text-text-secondary font-sans">
            Chọn giấy:
          </label>
          <PaperPicker selected={paperTheme} onChange={onPaperThemeChange} />
        </div>

        {/* Sticker Picker */}
        <div className="space-y-2 pt-1 min-w-0">
          <label className="block text-xs font-semibold text-text-secondary font-sans">
            Dán sticker (tối đa 3):
          </label>
          <StickerPicker
            selected={stickerIds}
            onChange={onStickerIdsChange}
            onMaxReached={onStickerMaxReached}
            max={3}
          />
        </div>
      </div>
    </div>
  );
}

export default Step2Content;
