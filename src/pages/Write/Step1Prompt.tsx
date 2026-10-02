import { PromptChips } from '@/components/wish/PromptChips';
import { PromptOption } from '@/lib/constants';

export interface Step1PromptProps {
  selectedPromptId: string | null;
  onSelectPrompt: (option: PromptOption) => void;
}

export function Step1Prompt({ selectedPromptId, onSelectPrompt }: Step1PromptProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-display text-2xl font-normal text-text-primary">
          Hôm nay bạn muốn gửi gì lên trời? ✨
        </h2>
        <p className="font-sans text-xs text-text-secondary">
          Chọn một câu mở đầu hoặc bắt đầu tự do nha.
        </p>
      </div>

      <PromptChips
        selectedId={selectedPromptId}
        onSelect={onSelectPrompt}
      />
    </div>
  );
}
