import { PromptChips } from '@/components/wish/PromptChips';
import { PromptOption } from '@/lib/constants';

export interface Step1PromptProps {
  selectedPromptId: string | null;
  onSelectPrompt: (option: PromptOption) => void;
}

export function Step1Prompt({ selectedPromptId, onSelectPrompt }: Step1PromptProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="font-display font-normal text-[34px] text-text-primary text-center leading-[1.3] mb-6">
        Hôm nay bạn muốn gửi gì lên trời?
      </h1>

      <div className="w-full max-w-[400px]">
        <PromptChips
          selectedId={selectedPromptId}
          onSelect={onSelectPrompt}
        />
      </div>
    </div>
  );
}

export default Step1Prompt;
