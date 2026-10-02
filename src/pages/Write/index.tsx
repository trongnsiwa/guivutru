import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMonths } from 'date-fns';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Button } from '@/components/ui/Button';
import { Step1Prompt } from './Step1Prompt';
import { Step2Content } from './Step2Content';
import { Step3Unlock } from './Step3Unlock';
import { PromptOption } from '@/lib/constants';
import { PaperTheme } from '@/types/note';

export function Write() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [theme, setTheme] = useState<PaperTheme>('dem-sao');
  const [stickers, setStickers] = useState<string[]>([]);
  const [unlockAt, setUnlockAt] = useState<number>(() => addMonths(new Date(), 1).getTime());

  const handleSelectPrompt = (option: PromptOption) => {
    setSelectedPromptId(option.id);
    if (option.template) {
      setContent(option.template);
    }
    setStep(2);
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      navigate('/viet/xong');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-between py-2 space-y-6">
      <div>
        <ProgressDots currentStep={step} onStepClick={(s) => setStep(s)} />

        <div className="mt-4">
          {step === 1 && (
            <Step1Prompt
              selectedPromptId={selectedPromptId}
              onSelectPrompt={handleSelectPrompt}
            />
          )}

          {step === 2 && (
            <Step2Content
              content={content}
              onContentChange={setContent}
              theme={theme}
              onThemeChange={setTheme}
              stickers={stickers}
              onStickersChange={setStickers}
            />
          )}

          {step === 3 && (
            <Step3Unlock
              unlockAt={unlockAt}
              onUnlockAtChange={setUnlockAt}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border-soft">
        <Button variant="ghost" onClick={handleBack}>
          {step === 1 ? 'Về trang chủ' : '← Quay lại'}
        </Button>

        <Button variant="primary" onClick={handleNext}>
          {step === 3 ? 'Niêm phong 🔒' : 'Tiếp tục →'}
        </Button>
      </div>
    </div>
  );
}

export default Write;
